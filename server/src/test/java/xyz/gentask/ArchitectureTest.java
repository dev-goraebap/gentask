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
            .because("공용 모듈에 특정 도메인 지식이 유입되는 것을 방지하기 위함이다");

    @ArchTest
    static final ArchRule 도메인은_상위_계층을_참조하지_않는다 = noClasses()
            .that()
            .resideInAPackage(DOMAIN)
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("xyz.gentask.module.(*).application..", "xyz.gentask.module.(*).infrastructure..")
            .because("도메인 계층은 상위 계층에 의존하지 않아야 한다");

    @ArchTest
    static final ArchRule 도메인은_프레임워크를_참조하지_않는다 = noClasses()
            .that()
            .resideInAPackage(DOMAIN)
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("org.springframework..", "org.jooq..", "jakarta..")
            .because("도메인 모델은 프레임워크 컨텍스트 없이 독립적으로 테스트 가능해야 한다");

    @ArchTest
    static final ArchRule 컨트롤러는_도메인을_직접_참조하지_않는다 = noClasses()
            .that()
            .haveSimpleNameEndingWith("Controller")
            .should()
            .dependOnClassesThat()
            .resideInAPackage(DOMAIN)
            .because("유스케이스를 우회한 도메인 직접 접근을 방지하기 위함이다");

    @ArchTest
    static final ArchRule 컨트롤러는_조회_포트를_직접_참조하지_않는다 = noClasses()
            .that()
            .haveSimpleNameEndingWith("Controller")
            .should()
            .dependOnClassesThat()
            .haveSimpleNameEndingWith("Query")
            .because("조회 서비스의 비즈니스 가공 로직 누락을 방지하기 위함이다");

    @ArchTest
    static final ArchRule 저장소는_화면_타입을_반환하지_않는다 = noMethods()
            .that()
            .areDeclaredInClassesThat()
            .haveSimpleNameEndingWith("Repository")
            .should()
            .haveRawReturnType(com.tngtech.archunit.base.DescribedPredicate.describe(
                    "application 패키지의 타입",
                    javaClass -> javaClass.getPackageName().contains(".application")))
            .because("저장소는 영속성 계층만 다루며, 화면 표현 모델은 별도의 조회 포트에서 처리해야 한다");

    @ArchTest
    static final ArchRule 값_객체의_정규_생성자는_재구성에만_쓴다 = noClasses()
            .that()
            .resideOutsideOfPackages(DOMAIN, "xyz.gentask.module.(*).infrastructure..")
            .should()
            .callConstructorWhere(target(owner(assignableTo(ValueObject.class))))
            .because("외부 입력값은 유효성 검증 팩토리 메서드(of)를 통해 생성해야 한다");

    @ArchTest
    static final ArchRule 서비스의_공개_메서드는_트랜잭션을_선언한다 = methods()
            .that()
            .arePublic()
            .and()
            .areDeclaredInClassesThat()
            .areAnnotatedWith(Service.class)
            .should()
            .beAnnotatedWith(Transactional.class)
            .because("비트랜잭션 쓰기 작업으로 인한 데이터 불일치를 방지하기 위함이다");

    @ArchTest
    static final ArchRule 인프라_구현은_모듈_밖에_공개되지_않는다 = classes()
            .that()
            .resideInAPackage("xyz.gentask.module.(*).infrastructure..")
            .and()
            .haveSimpleNameStartingWith("Jooq")
            .should()
            .notBePublic()
            .because("모듈 외부는 포트 인터페이스를 통해서만 인프라에 접근해야 한다");
}
