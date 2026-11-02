package com.agence.voyage.profile;

import com.agence.voyage.config.UploadProperties;
import com.agence.voyage.entity.*;
import com.agence.voyage.entity.Role;
import com.agence.voyage.repository.*;
import com.agence.voyage.security.AppUserDetails;
import com.agence.voyage.service.*;
import com.fasterxml.jackson.databind.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.*;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.context.annotation.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.*;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.*;
import java.nio.file.*;
import java.nio.file.attribute.FileTime;
import java.time.*;
import java.util.*;
import java.util.zip.CRC32;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.doReturn;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties="spring.datasource.url=jdbc:h2:mem:phase6_files_${random.uuid};MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE")
@AutoConfigureMockMvc @ActiveProfiles("test") @Import(FileUploadIntegrationTest.TimeConfig.class)
class FileUploadIntegrationTest {
    @TestConfiguration static class TimeConfig {@Bean @Primary Clock imageClock(){return Clock.fixed(Instant.parse("2026-10-31T12:00:00Z"),ZoneOffset.UTC);}}
    @Autowired MockMvc mvc;@Autowired ObjectMapper json;@Autowired UserRepository users;@Autowired CityRepository cities;
    @Autowired FileAssetRepository files;@Autowired FileStorageService storage;@Autowired FileCleanupService cleanup;@Autowired Clock clock;
    @Autowired PlatformTransactionManager manager;@SpyBean UploadProperties properties;
    User supplier,other,client,admin;City city;
    User account(Role role){User u=new User(role.name(),"images-"+UUID.randomUUID()+"@test.ma","hash",role);if(role==Role.SUPPLIER)u.setSupplierCategory(OfferType.HOTEL);return users.save(u);}
    @BeforeEach void setup(){supplier=account(Role.SUPPLIER);other=account(Role.SUPPLIER);client=account(Role.CLIENT);admin=account(Role.ADMIN);city=cities.save(new City("Ville image "+UUID.randomUUID(),31d,-7d));doReturn(200).when(properties).maxTempFiles();}
    byte[] image(String format,int width,int height,boolean alpha)throws Exception{BufferedImage image=new BufferedImage(width,height,alpha?BufferedImage.TYPE_INT_ARGB:BufferedImage.TYPE_INT_RGB);var graphics=image.createGraphics();graphics.setColor(new java.awt.Color(11,60,143,alpha?150:255));graphics.fillRect(0,0,width,height);graphics.dispose();var output=new ByteArrayOutputStream();assertTrue(ImageIO.write(image,format,output));return output.toByteArray();}
    MockMultipartFile part(String name,String contentType,byte[] bytes){return new MockMultipartFile("file",name,contentType,bytes);}
    ResultActions upload(User actor,String purpose,MockMultipartFile part)throws Exception{return mvc.perform(multipart("/api/files/images").file(part).param("purpose",purpose).with(user(new AppUserDetails(actor))));}
    JsonNode uploaded(User actor,String purpose)throws Exception{return json.readTree(upload(actor,purpose,part("../../etc/passwd.jpg.php","application/octet-stream",image("png",400,250,false))).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());}
    String stored(JsonNode asset){return asset.get("url").asText().substring(asset.get("url").asText().lastIndexOf('/')+1);}
    @Test void jpegUploadCreatesOriginalAndThumbnailAndPublicSafeHeaders()throws Exception{
        var asset=json.readTree(upload(supplier,"OFFER_IMAGE",part("x.jpg.php","text/html",image("jpg",2200,300,false))).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
        assertEquals(1920,asset.get("width").asInt());assertTrue(storage.exists(stored(asset)));String thumbnail=asset.get("thumbnailUrl").asText().replaceAll(".*/","");assertTrue(storage.exists(thumbnail));
        assertEquals(480,ImageIO.read(storage.resolve(thumbnail).toFile()).getWidth());assertTrue(stored(asset).matches("[0-9a-f-]{36}\\.jpg"));
        mvc.perform(get("/api/files/"+stored(asset))).andExpect(status().isOk()).andExpect(header().string("X-Content-Type-Options","nosniff")).andExpect(header().string("Cache-Control",org.hamcrest.Matchers.containsString("immutable"))).andExpect(content().contentType("image/jpeg"));
        mvc.perform(get("/api/files/"+thumbnail)).andExpect(status().isOk());
    }
    @Test void pngTransparencyPreserved()throws Exception{
        var result=json.readTree(upload(client,"AVATAR",part("avatar.png","image/png",image("png",300,200,true))).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());assertEquals("image/png",result.get("contentType").asText());assertTrue(ImageIO.read(storage.resolve(stored(result)).toFile()).getColorModel().hasAlpha());
    }
    @Test void webpDecodedByImageIoAndReencoded()throws Exception{
        byte[] source=getClass().getResourceAsStream("/images/atlas-fixture.webp").readAllBytes();assertEquals(384,ImageIO.read(new ByteArrayInputStream(source)).getWidth());
        var result=json.readTree(upload(supplier,"OFFER_IMAGE",part("photo.webp","image/webp",source)).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());assertEquals(384,result.get("width").asInt());assertTrue(List.of("image/jpeg","image/png").contains(result.get("contentType").asText()));
    }
    @ParameterizedTest @ValueSource(strings={"not an image","<svg xmlns='http://www.w3.org/2000/svg'></svg>","%PDF-1.7","MZ executable"})
    void rejectsNonImagesAndSvg(String value)throws Exception{upload(supplier,"OFFER_IMAGE",part("photo.jpg","image/jpeg",value.getBytes())).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_IMAGE"));}
    @Test void rejectsOversizedBodyBeforeDecode()throws Exception{upload(client,"AVATAR",part("big.png","image/png",new byte[5242881])).andExpect(status().isPayloadTooLarge()).andExpect(jsonPath("$.code").value("UPLOAD_TOO_LARGE"));}
    @Test void rejectsSmallAndExcessiveDimensionsBeforeDecode()throws Exception{
        upload(client,"AVATAR",part("small.jpg","image/jpeg",image("jpg",199,300,false))).andExpect(status().isBadRequest());
        byte[] png=image("png",300,200,false);ByteBuffer.wrap(png,16,8).putInt(7000).putInt(7000);CRC32 crc=new CRC32();crc.update(png,12,17);ByteBuffer.wrap(png,29,4).putInt((int)crc.getValue());
        upload(client,"AVATAR",part("bomb.png","image/png",png)).andExpect(status().isBadRequest());
    }
    @Test void rejectsAppendedAndEmbeddedSecondaryPayloads()throws Exception{
        byte[] jpeg=image("jpg",300,200,false),payload="<html><script>alert(1)</script></html>".getBytes();var output=new ByteArrayOutputStream();output.write(jpeg);output.write(payload);
        upload(supplier,"OFFER_IMAGE",part("poly.jpg","image/jpeg",output.toByteArray())).andExpect(status().isBadRequest());
        byte[] png=image("png",300,200,false);output.reset();output.write(png);output.write(payload);upload(supplier,"OFFER_IMAGE",part("poly.png","image/png",output.toByteArray())).andExpect(status().isBadRequest());
    }
    @Test void exifOrientationCorrectedAndMetadataStripped()throws Exception{
        byte[] source=image("jpg",300,200,false);ByteBuffer exif=ByteBuffer.allocate(32).order(ByteOrder.LITTLE_ENDIAN);exif.put(new byte[]{69,120,105,102,0,0,73,73,42,0}).putInt(8).putShort((short)1).putShort((short)274).putShort((short)3).putInt(1).putShort((short)6).putShort((short)0).putInt(0);
        var output=new ByteArrayOutputStream();output.write(source,0,2);output.write(new byte[]{(byte)255,(byte)225,0,34});output.write(exif.array());output.write(source,2,source.length-2);
        var asset=json.readTree(upload(client,"AVATAR",part("rotated.jpg","image/jpeg",output.toByteArray())).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
        assertEquals(200,asset.get("width").asInt());assertEquals(300,asset.get("height").asInt());assertFalse(new String(Files.readAllBytes(storage.resolve(stored(asset))),java.nio.charset.StandardCharsets.ISO_8859_1).contains("Exif"));
    }
    @Test void enforcesRolePurposeAndSingleFile()throws Exception{
        upload(client,"OFFER_IMAGE",part("image.jpg","image/jpeg",image("jpg",300,200,false))).andExpect(status().isForbidden());
        upload(admin,"SUPPLIER_LOGO",part("image.jpg","image/jpeg",image("jpg",300,200,false))).andExpect(status().isForbidden());
        uploaded(admin,"AVATAR");
        mvc.perform(multipart("/api/files/images").file(part("a.jpg","image/jpeg",image("jpg",300,200,false))).param("purpose","AVATAR")).andExpect(status().isUnauthorized());
        mvc.perform(multipart("/api/files/images").file(part("a.jpg","image/jpeg",image("jpg",300,200,false))).file(part("b.jpg","image/jpeg",image("jpg",300,200,false))).param("purpose","AVATAR").with(user(new AppUserDetails(client)))).andExpect(status().isBadRequest());
    }
    @Test void deletionEnforcesOwnershipAndRemovesBothFiles()throws Exception{
        var asset=uploaded(supplier,"OFFER_IMAGE");mvc.perform(delete("/api/files/"+asset.get("id").asText()).with(user(new AppUserDetails(other)))).andExpect(status().isForbidden());
        mvc.perform(delete("/api/files/"+asset.get("id").asText()).with(user(new AppUserDetails(admin)))).andExpect(status().isNoContent());assertFalse(storage.exists(stored(asset)));assertTrue(files.findById(asset.get("id").asText()).isEmpty());
    }
    @Test void traversalAndUnknownNamesRefused()throws Exception{
        assertThrows(RuntimeException.class,()->storage.resolve("../../application.properties"));assertThrows(RuntimeException.class,()->storage.resolve("x.jpg.php"));mvc.perform(get("/api/files/not-a-uuid.jpg")).andExpect(status().isNotFound());
    }
    @Test void temporaryQuotaEnforced()throws Exception{doReturn(1).when(properties).maxTempFiles();uploaded(client,"AVATAR");upload(client,"AVATAR",part("second.png","image/png",image("png",300,200,false))).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("FILE_QUOTA_EXCEEDED"));}
    Map<String,Object> offer(List<String> images){var body=new HashMap<String,Object>();body.put("type","HOTEL");body.put("title","Offre images");body.put("cityId",city.getId());body.put("basePrice",100);body.put("stars",4);body.put("roomType","Double");body.put("active",true);body.put("images",images);body.put("availabilities",List.of(Map.of("startAt","2026-11-10T00:00:00","endAt","2026-12-31T23:59:59","capacity",10)));return body;}
    @Test void offerAttachesFiveImagesRejectsSixAndReleasesReplacement()throws Exception{
        var urls=new ArrayList<String>();for(int i=0;i<5;i++)urls.add(uploaded(supplier,"OFFER_IMAGE").get("url").asText());
        String response=mvc.perform(post("/api/offers").with(user(new AppUserDetails(supplier))).contentType("application/json").content(json.writeValueAsString(offer(urls)))).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();long id=json.readTree(response).get("id").asLong();
        var first=files.findByStoredNameOrThumbnailName(urls.getFirst().replaceAll(".*/",""),"").orElseThrow();assertEquals(FileAsset.Status.ATTACHED,first.status);
        mvc.perform(delete("/api/files/"+first.id).with(user(new AppUserDetails(supplier)))).andExpect(status().isConflict());
        mvc.perform(put("/api/offers/"+id).with(user(new AppUserDetails(supplier))).contentType("application/json").content(json.writeValueAsString(offer(urls.subList(1,5))))).andExpect(status().isOk());assertEquals(FileAsset.Status.TEMP,files.findById(first.id).orElseThrow().status);
        assertEquals(first.createdAt,files.findById(first.id).orElseThrow().createdAt);assertNotNull(files.findById(first.id).orElseThrow().orphanedAt);
        var six=new ArrayList<>(urls);six.add(urls.getFirst());mvc.perform(post("/api/offers").with(user(new AppUserDetails(supplier))).contentType("application/json").content(json.writeValueAsString(offer(six)))).andExpect(status().isBadRequest());
    }
    @Test void foreignAndArbitraryNewOfferImagesRefused()throws Exception{
        String url=uploaded(other,"OFFER_IMAGE").get("url").asText();mvc.perform(post("/api/offers").with(user(new AppUserDetails(supplier))).contentType("application/json").content(json.writeValueAsString(offer(List.of(url))))).andExpect(status().isForbidden());
        mvc.perform(post("/api/offers").with(user(new AppUserDetails(supplier))).contentType("application/json").content(json.writeValueAsString(offer(List.of("https://evil.test/image.jpg"))))).andExpect(status().isBadRequest());
    }
    @Test void cleanupDryRunAndRealPreserveAttachedAndReconcileDisk()throws Exception{
        var temp=uploaded(client,"AVATAR");var attached=uploaded(client,"AVATAR");
        new TransactionTemplate(manager).execute(s->{for(var asset:List.of(temp,attached)){FileAsset f=files.findById(asset.get("id").asText()).orElseThrow();f.createdAt=LocalDateTime.now(clock).minusHours(25);if(asset==attached){f.status=FileAsset.Status.ATTACHED;f.attachmentKey="avatar:"+client.getId();}}return null;});
        assertTrue(cleanup.purgeExpired(true)>=1);assertTrue(storage.exists(stored(temp)));cleanup.purgeExpired(false);assertFalse(storage.exists(stored(temp)));assertTrue(storage.exists(stored(attached)));
        String orphan=UUID.randomUUID()+".png";storage.store(orphan,image("png",300,200,false));Files.setLastModifiedTime(storage.resolve(orphan),FileTime.from(clock.instant().minus(Duration.ofHours(25))));
        assertTrue(cleanup.reconcile(true)>=1);assertTrue(storage.exists(orphan));cleanup.reconcile(false);assertFalse(storage.exists(orphan));assertTrue(storage.exists(stored(attached)));
    }
}
