package com.agence.voyage.foundation;

import com.agence.voyage.entity.*;
import com.agence.voyage.repository.UserRepository;
import com.fasterxml.jackson.databind.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PaginationContractTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired UserRepository users;
    @Test void allListRoutesSupportBothContracts() throws Exception {
        for (String path : new String[]{"/api/users","/api/cities","/api/offers","/api/bundles","/api/promo-codes"}) {
            var raw = mvc.perform(get(path).with(user("admin").roles("ADMIN"))).andReturn();
            assertEquals(200, raw.getResponse().getStatus());
            assertTrue(mapper.readTree(raw.getResponse().getContentAsString()).isArray());
            var paged = mvc.perform(get(path).param("page","0").with(user("admin").roles("ADMIN"))).andReturn();
            assertEquals(200, paged.getResponse().getStatus());
            JsonNode body = mapper.readTree(paged.getResponse().getContentAsString());
            for (String field : new String[]{"content","page","size","totalElements","totalPages","first","last","sort"}) {
                assertTrue(body.has(field), path + " : " + field);
            }
            assertEquals(20, body.get("size").asInt());
            var invalid = mvc.perform(get(path).param("sort","password,asc").with(user("admin").roles("ADMIN"))).andReturn();
            assertEquals(400, invalid.getResponse().getStatus());
            assertEquals("BAD_REQUEST", mapper.readTree(invalid.getResponse().getContentAsString()).get("code").asText());
        }
    }
    @Test void capsSizeAndCountsDatabaseRows() throws Exception {
        for (int i=0;i<125;i++) users.save(new User("User "+i, "pagination-"+i+"@example.com", "test-hash", Role.CLIENT));
        var result = mvc.perform(get("/api/users").param("size","999").param("sort","id,desc")
                .with(user("admin").roles("ADMIN"))).andReturn();
        JsonNode body = mapper.readTree(result.getResponse().getContentAsString());
        assertEquals(users.count(), body.get("totalElements").asLong());
        assertEquals(100, body.get("content").size()); assertEquals(100, body.get("size").asInt());
        var beyond = mvc.perform(get("/api/users").param("page","2147483647")
                .with(user("admin").roles("ADMIN"))).andReturn();
        assertEquals(0, mapper.readTree(beyond.getResponse().getContentAsString()).get("content").size());
    }
    @Test void searchPreservesMetadataAndSortAliases() throws Exception {
        for (String sort : new String[]{"price_asc","price_desc","recent","basePrice,asc"}) {
            var result = mvc.perform(get("/api/offers/search").param("size","999").param("sort",sort)).andReturn();
            assertEquals(200, result.getResponse().getStatus());
            var body = mapper.readTree(result.getResponse().getContentAsString());
            assertEquals(100, body.get("size").asInt());
            assertTrue(body.has("typeCounts")); assertTrue(body.has("maxPrice"));
            assertTrue(body.has("first")); assertTrue(body.has("last")); assertTrue(body.has("sort"));
        }
        var invalid = mvc.perform(get("/api/offers/search").param("sort","unsafe,asc")).andReturn();
        assertEquals(400, invalid.getResponse().getStatus());
    }
}
