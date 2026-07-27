package vn.viettel.khdn.crm_DN_VNR20K_2K.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RegionEnum;

@Entity
@Table(name = "clusters")
@Getter
@Setter
public class Cluster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private RegionEnum region;
}
