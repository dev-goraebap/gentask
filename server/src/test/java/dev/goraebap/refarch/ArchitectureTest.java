package dev.goraebap.refarch;

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
import dev.goraebap.refarch.shared.domain.ValueObject;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 배치 규칙을 빌드에서 강제한다.
 *
 * <p>참조 문서의 규칙 중 <b>기계가 판정할 수 있는 것</b>만 여기 있다. 강제되지 않는 규칙이
 * 무엇인지는 문서의 강제 현황 표가 갖는다.
 *
 * <p>구조를 바꿔야 하면 문서를 먼저 고치고 이 테스트를 함께 고친다. 테스트만 완화하는 변경은
 * 규칙이 사라진 것을 기록 없이 만드는 일이다.
 */
@AnalyzeClasses(packages = "dev.goraebap.refarch", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

    private static final String MODULE = "dev.goraebap.refarch.module..";
    private static final String DOMAIN = "dev.goraebap.refarch.module.(*).domain..";
    private static final String SHARED = "dev.goraebap.refarch.shared..";

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
            .resideInAnyPackage(
                    "dev.goraebap.refarch.module.(*).application..", "dev.goraebap.refarch.module.(*).infrastructure..")
            .because("도메인은 자기를 쓰는 쪽을 알지 않는다");

    /**
     * 이 규칙이 깨지면 도메인 단위 테스트가 애플리케이션 컨텍스트를 요구하게 되어 검증 속도와
     * 범위가 함께 무너진다. 다른 규칙은 어기면 구조가 지저분해질 뿐이다.
     *
     * <p>Lombok 은 목록에 없다. 컴파일 시점에 코드를 만들 뿐 런타임 의존이 없어 이 규칙이
     * 지키려는 것 — 컨텍스트 없이 도는 검증 — 을 해치지 않는다. 다른 프로젝트로 옮길 때도
     * 생성된 코드가 남으므로 이식을 막지 않는다.
     */
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

    /**
     * 저장소가 화면 어휘의 타입을 반환하기 시작하면 그것은 이미 저장소가 아니라 읽기 계층이다.
     *
     * <p>제네릭 인자까지는 보지 못한다. {@code Optional<TaskView>} 는 raw 타입이 {@code Optional}
     * 이라 이 검사를 통과한다. 직접 반환만 잡는다는 한계를 알고 쓴다.
     */
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

    /**
     * 값 객체의 정규 생성자는 검증하지 않는다. 저장소가 재구성할 때만 쓰며, 그 밖에서 쓰면
     * 검증을 지나지 않은 값이 도메인에 들어온다.
     *
     * <p>record 의 정규 생성자는 record 자신보다 좁은 접근 제한을 가질 수 없어 언어로는 막지
     * 못한다. 그래서 이 규칙이 그 자리를 대신한다.
     */
    @ArchTest
    static final ArchRule 값_객체의_정규_생성자는_재구성에만_쓴다 = noClasses()
            .that()
            .resideOutsideOfPackages(DOMAIN, "dev.goraebap.refarch.module.(*).infrastructure..")
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
            .resideInAPackage("dev.goraebap.refarch.module.(*).infrastructure..")
            .and()
            .haveSimpleNameStartingWith("Jooq")
            .should()
            .notBePublic()
            .because("바깥은 포트로만 쓴다");
}
