package xyz.gentask;

import static com.tngtech.archunit.core.domain.JavaCall.Predicates.target;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.assignableTo;
import static com.tngtech.archunit.core.domain.properties.HasOwner.Predicates.With.owner;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.methods;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noMethods;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.shared.domain.ValueObject;

@AnalyzeClasses(packages = "xyz.gentask", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

    private static final String MODULE = "xyz.gentask.module..";
    private static final String DOMAIN = "xyz.gentask.module.(*).domain..";
    private static final String SHARED = "xyz.gentask.shared..";

    @ArchTest
    static final ArchRule 공용_기반은_모듈을_참조하지_않는다 = noClasses()
            .that()
            .resideInAPackage(SHARED)
            .should()
            .dependOnClassesThat()
            .resideInAPackage(MODULE)
            .because("공용 기반에 도메인 지식이 유입되면 그것은 더 이상 공용이 아니라 또 하나의 모듈이다");

    @ArchTest
    static final ArchRule 도메인은_상위_계층을_참조하지_않는다 = noClasses()
            .that()
            .resideInAPackage(DOMAIN)
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("xyz.gentask.module.(*).application..", "xyz.gentask.module.(*).infrastructure..")
            .because("도메인은 자기를 쓰는 쪽을 알지 않는다");

    @ArchTest
    static final ArchRule 도메인은_프레임워크를_참조하지_않는다 = noClasses()
            .that()
            .resideInAPackage(DOMAIN)
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("org.springframework..", "org.jooq..", "jakarta..")
            .because("도메인의 검증이 컨텍스트 없이 돌아야 한다");

    @ArchTest
    static final ArchRule 컨트롤러는_도메인을_직접_참조하지_않는다 = noClasses()
            .that()
            .haveSimpleNameEndingWith("Controller")
            .should()
            .dependOnClassesThat()
            .resideInAPackage(DOMAIN)
            .because("유스케이스를 우회한 데이터 접근이 열린다");

    @ArchTest
    static final ArchRule 컨트롤러는_조회_포트를_직접_참조하지_않는다 = noClasses()
            .that()
            .haveSimpleNameEndingWith("Controller")
            .should()
            .dependOnClassesThat()
            .haveSimpleNameEndingWith("Query")
            .because("조회 서비스가 전후에 수행하는 가공이 누락된다");

    @ArchTest
    static final ArchRule 저장소는_화면_타입을_반환하지_않는다 = noMethods()
            .that()
            .areDeclaredInClassesThat()
            .haveSimpleNameEndingWith("Repository")
            .should()
            .haveRawReturnType(com.tngtech.archunit.base.DescribedPredicate.describe(
                    "application 패키지의 타입",
                    javaClass -> javaClass.getPackageName().contains(".application")))
            .because("화면 어휘의 타입이 필요해지는 순간 그것은 조회 포트다");

    @ArchTest
    static final ArchRule 값_객체의_정규_생성자는_재구성에만_쓴다 = noClasses()
            .that()
            .resideOutsideOfPackages(DOMAIN, "xyz.gentask.module.(*).infrastructure..")
            .should()
            .callConstructorWhere(target(owner(assignableTo(ValueObject.class))))
            .because("바깥에서 들어온 값은 검증하는 팩토리(of)를 지나야 한다");

    @ArchTest
    static final ArchRule 서비스의_공개_메서드는_트랜잭션을_선언한다 = methods()
            .that()
            .arePublic()
            .and()
            .areDeclaredInClassesThat()
            .areAnnotatedWith(Service.class)
            .should()
            .beAnnotatedWith(Transactional.class)
            .because("빠뜨리면 트랜잭션 없이 도는 쓰기가 생기고 그것은 실패했을 때만 드러난다");

    @ArchTest
    static final ArchRule 인프라_구현은_모듈_밖에_공개되지_않는다 = classes()
            .that()
            .resideInAPackage("xyz.gentask.module.(*).infrastructure..")
            .and()
            .haveSimpleNameStartingWith("Jooq")
            .should()
            .notBePublic()
            .because("바깥은 포트로만 쓴다");
}
