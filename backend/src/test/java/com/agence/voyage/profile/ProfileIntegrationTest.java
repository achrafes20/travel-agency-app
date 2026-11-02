package com.agence.voyage.profile;
import com.agence.voyage.entity.*;
import com.agence.voyage.repository.*;
import com.agence.voyage.security.AppUserDetails;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import java.time.*;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")
class ProfileIntegrationTest {
    @Autowired MockMvc mvc;@Autowired UserRepository users;@Autowired CityRepository cities;@Autowired FileAssetRepository files;
    User client,supplier,other,admin;
    User account(Role role){return users.save(new User("Compte test","profile-"+UUID.randomUUID()+"@test.ma","hash",role));}
    @BeforeEach void setup(){client=account(Role.CLIENT);supplier=account(Role.SUPPLIER);other=account(Role.SUPPLIER);admin=account(Role.ADMIN);}
    @Test void updatePersistsAndMeExposesOnlySafeFields()throws Exception{
        mvc.perform(put("/api/auth/profile").with(user(new AppUserDetails(client))).contentType("application/json")
            .content("{\"fullName\":\"  Nouveau nom  \",\"phone\":\"+212 6 12 34 56 78\",\"country\":\"ma\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.fullName").value("Nouveau nom")).andExpect(jsonPath("$.phone").value("+212612345678"))
            .andExpect(jsonPath("$.country").value("MA")).andExpect(jsonPath("$.password").doesNotExist()).andExpect(jsonPath("$.tokenVersion").doesNotExist());
        assertEquals("Nouveau nom",users.findById(client.getId()).orElseThrow().getFullName());
        mvc.perform(get("/api/auth/me").with(user(new AppUserDetails(client)))).andExpect(jsonPath("$.phone").value("+212612345678"));
    }
    @ParameterizedTest @ValueSource(strings={"{\"fullName\":\"\"}","{\"fullName\":\"x\"}","{\"fullName\":\"Nom\",\"phone\":\"123\"}","{\"fullName\":\"Nom\",\"country\":\"ZZ\"}","{\"fullName\":\"Nom\",\"role\":\"ADMIN\"}","{\"fullName\":\"Nom\",\"supplierCategory\":\"HOTEL\"}","{\"fullName\":\"Nom\",\"archived\":true}","{\"fullName\":\"Nom\",\"avatarUrl\":\"https://evil.test/a.jpg\"}"})
    void invalidProfileRejected(String json)throws Exception{
        mvc.perform(put("/api/auth/profile").with(user(new AppUserDetails(client))).contentType("application/json").content(json)).andExpect(status().isBadRequest());
        assertEquals(Role.CLIENT,users.findById(client.getId()).orElseThrow().getRole());
    }
    @Test void emailChangeRefused()throws Exception{
        mvc.perform(put("/api/auth/profile").with(user(new AppUserDetails(client))).contentType("application/json").content("{\"fullName\":\"Nom\",\"email\":\"other@test.ma\"}"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("EMAIL_NOT_EDITABLE"));
    }
    @Test void uploadedAvatarOwnershipAndReplacement()throws Exception{
        FileAsset file=new FileAsset();file.owner=client;file.purpose=FilePurpose.AVATAR;file.storedName=UUID.randomUUID()+".jpg";file.thumbnailName=UUID.randomUUID()+".jpg";file.contentType="image/jpeg";file.createdAt=LocalDateTime.now();file=files.saveAndFlush(file);
        String body="{\"fullName\":\"Nom\",\"avatarUrl\":\"http://localhost:8080/api/files/"+file.storedName+"\"}";
        mvc.perform(put("/api/auth/profile").with(user(new AppUserDetails(supplier))).contentType("application/json").content(body)).andExpect(status().isBadRequest());
        mvc.perform(put("/api/auth/profile").with(user(new AppUserDetails(client))).contentType("application/json").content(body)).andExpect(status().isOk());
        assertEquals(FileAsset.Status.ATTACHED,files.findById(file.id).orElseThrow().status);
        mvc.perform(put("/api/auth/profile").with(user(new AppUserDetails(client))).contentType("application/json").content("{\"fullName\":\"Nom\",\"phone\":\"\",\"avatarUrl\":\"\"}")).andExpect(status().isOk());
        assertEquals(FileAsset.Status.TEMP,files.findById(file.id).orElseThrow().status);
    }
    @Test void supplierProfileLazyUpdateAndAccessRules()throws Exception{
        mvc.perform(get("/api/suppliers/me/profile").with(user(new AppUserDetails(supplier)))).andExpect(status().isOk()).andExpect(jsonPath("$.companyName").isEmpty());
        var city=cities.save(new City("Ville profil "+UUID.randomUUID(),31d,-7d));
        String json="{\"companyName\":\"Atlas SARL\",\"contactPhone\":\"+212612345678\",\"cityId\":"+city.getId()+",\"ice\":\"123456789012345\",\"legalForm\":\"SARL\"}";
        mvc.perform(put("/api/suppliers/me/profile").with(user(new AppUserDetails(supplier))).contentType("application/json").content(json)).andExpect(status().isOk()).andExpect(jsonPath("$.ice").value("123456789012345"));
        mvc.perform(get("/api/suppliers/me/profile").with(user(new AppUserDetails(other)))).andExpect(jsonPath("$.companyName").isEmpty());
        mvc.perform(get("/api/suppliers/"+supplier.getId()+"/profile").with(user(new AppUserDetails(other)))).andExpect(status().isForbidden());
        mvc.perform(get("/api/suppliers/"+supplier.getId()+"/profile").with(user(new AppUserDetails(admin)))).andExpect(status().isOk()).andExpect(jsonPath("$.companyName").value("Atlas SARL"));
        mvc.perform(get("/api/suppliers/me/profile").with(user(new AppUserDetails(client)))).andExpect(status().isForbidden());
        mvc.perform(put("/api/suppliers/me/profile").with(user(new AppUserDetails(supplier))).contentType("application/json").content(json.replace("123456789012345","123"))).andExpect(status().isBadRequest());
        supplier.setArchived(true);users.save(supplier);
        mvc.perform(get("/api/suppliers/"+supplier.getId()+"/profile").with(user(new AppUserDetails(admin)))).andExpect(status().isOk());
    }
    @Test void supplierCityRequiresCoordinatesOrKnownId()throws Exception{
        mvc.perform(put("/api/suppliers/me/profile").with(user(new AppUserDetails(supplier))).contentType("application/json").content("{\"companyName\":\"Atlas SARL\",\"cityName\":\"Ville libre\"}")).andExpect(status().isBadRequest());
    }
}
