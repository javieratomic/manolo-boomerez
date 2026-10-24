export const HOUSING_FORMS={
 apartamentos:{name:'Edificio de 25 apartamentos',units:25,cost:2000000,upkeep:100,moral:1,rentFactor:1,sprite:'bld_vivienda'},
 chalets:{name:'Urbanización de 10 chalets',units:10,cost:3000000,upkeep:200,moral:3,rentFactor:1.5,sprite:'bld_urbanizacion'},
 legacy:{name:'Viviendas anteriores',units:10,cost:800000,upkeep:100,moral:0,rentFactor:1,sprite:'bld_vivienda'},
};
export function housingSpec(b) {
 const spec=HOUSING_FORMS[b.housingForm||'legacy'];
 const level=b.level||1;
 return {...spec,units:spec.units+(b.housingForm&&b.housingForm!=='legacy'?0:5*(level-1)),rentFactor:spec.rentFactor*(1+0.03*(level-1))};
}
