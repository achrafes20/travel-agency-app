package com.agence.voyage.config;
import com.agence.voyage.entity.*;
import com.agence.voyage.repository.*;
import org.springframework.stereotype.Component;
import org.springframework.core.annotation.Order;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;

@Component @Order(10) @ConditionalOnProperty(name="app.seed.enabled",havingValue="true")
public class ProfileDemoSeeder implements CommandLineRunner {
    private final UserRepository users;private final SupplierProfileRepository profiles;private final CityRepository cities;private final Clock clock;
    public ProfileDemoSeeder(UserRepository users,SupplierProfileRepository profiles,CityRepository cities,Clock clock){this.users=users;this.profiles=profiles;this.cities=cities;this.clock=clock;}
    @Override @Transactional public void run(String...args){
        int i=0;var places=cities.findAll();
        for(User u:users.findAll()){
            if(!java.util.Set.of("sarah.benali@example.com","karim.idrissi@atlasvoyage.ma","vols@atlasvoyage.ma","voitures@atlasvoyage.ma","transferts@atlasvoyage.ma","excursions@atlasvoyage.ma","nadia.elfassi@atlasvoyage.ma","omar.tazi@atlasvoyage.ma","client.stats.demo@atlasvoyage.test").contains(u.getEmail()))continue;
            u.setEmailVerified(true);
            // Migration historique : updatedAt=createdAt. Respecter ensuite les champs effacés par le profil.
            if(java.util.Objects.equals(u.getUpdatedAt(),u.getCreatedAt())){
                if(u.getCountry()==null)u.setCountry("MA");
                if(u.getPhone()==null)u.setPhone("+212612345678");
            }
            // Ne jamais remettre tokenVersion à zéro : cela réactiverait d'anciens JWT.
            if(u.getRole()!=Role.SUPPLIER||profiles.findByUserId(u.getId()).isPresent())continue;
            SupplierProfile p=new SupplierProfile();p.user=u;p.companyName=u.getFullName()+" SARL";p.contactPhone=u.getPhone();
            p.city=places.isEmpty()?null:places.get(i++%places.size());p.address="Centre-ville — démonstration";p.description="Prestations de voyage — compte de démonstration";
            p.legalForm="SARL";p.registrationNumber="DEMO-"+u.getId();p.ice=String.format("%015d",u.getId());p.taxId="DEMO-IF-"+u.getId();
            p.legalNotes="Informations fictives de démonstration";p.createdAt=p.updatedAt=LocalDateTime.now(clock);profiles.save(p);
        }
    }
}
