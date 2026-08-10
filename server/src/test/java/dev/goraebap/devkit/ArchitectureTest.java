package dev.goraebap.devkit;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.base.DescribedPredicate;
import com.tngtech.archunit.core.domain.Dependency;
import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchCondition;
import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.lang.ConditionEvents;
import com.tngtech.archunit.lang.SimpleConditionEvent;
import com.tngtech.archunit.library.dependencies.SlicesRuleDefinition;
import java.util.Set;

/**
 * docs/아키텍처.md §10의 구조 규칙을 강제한다. 위반은 빌드 실패다.
 *
 * <p>아직 해당 코드가 없는 규칙은 통과하지만(모듈이 추가되면 즉시 적용된다), 규칙을 먼저 두는 것이
 * 목적이다 — 강제 장치 없는 구조는 반드시 부패한다.
 */
@AnalyzeClasses(packages = ArchitectureTest.ROOT, importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

    static final String ROOT = "dev.goraebap.devkit";

    /**
     * 모듈이 아닌 패키지. jOOQ 생성 산출물은 우리 구조 규칙의 대상이 아니고, {@code common}은
     * 모듈이 아니라 모든 모듈이 딛는 바닥이다(docs/references/패키지-배치와-참조-규칙.md §1).
     */
    private static final Set<String> NOT_MODULES = Set.of("jooq", "config", "common");

    // 1. 다른 모듈의 하위 패키지(internal) 참조 금지
    @ArchTest
    static final ArchRule 모듈_internal_참조_금지 = classes()
            .should(new ArchCondition<JavaClass>("다른 모듈의 internal 패키지를 참조하지 않는다") {
                @Override
                public void check(JavaClass item, ConditionEvents events) {
                    String ownModule = moduleOf(item);
                    for (Dependency dependency : item.getDirectDependenciesFromSelf()) {
                        JavaClass target = dependency.getTargetClass();
                        String targetModule = moduleOf(target);
                        if (targetModule == null || targetModule.equals(ownModule)) {
                            continue;
                        }
                        if (isInternal(target, targetModule)) {
                            events.add(SimpleConditionEvent.violated(item, dependency.getDescription()));
                        }
                    }
                }
            })
            .allowEmptyShould(true);

    // 2. domain은 바깥을 모른다
    @ArchTest
    static final ArchRule domain은_바깥을_모른다 = noClasses()
            .that()
            .resideInAPackage("..domain..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage(
                    "..application..", "..infrastructure..", "org.springframework..", "jakarta..", "org.jooq..")
            .allowEmptyShould(true);

    // 3. application은 infrastructure를 모른다 (포트로만)
    @ArchTest
    static final ArchRule application은_infrastructure를_모른다 = noClasses()
            .that()
            .resideInAPackage("..application..")
            .should()
            .dependOnClassesThat()
            .resideInAPackage("..infrastructure..")
            .allowEmptyShould(true);

    // 4. 피쳐 슬라이스 간 순환 금지
    @ArchTest
    static final ArchRule 피쳐_순환_금지 = SlicesRuleDefinition.slices()
            .matching(ROOT + ".(*).application.(*)..")
            .namingSlices("$1/$2")
            .should()
            .beFreeOfCycles()
            .allowEmptyShould(true);

    // 5. shared는 피쳐를 모른다
    @ArchTest
    static final ArchRule shared는_피쳐를_모른다 = noClasses()
            .that()
            .resideInAPackage("..application.shared..")
            .should()
            .dependOnClassesThat(new DescribedPredicate<JavaClass>("다른 피쳐 패키지에 속한다") {
                @Override
                public boolean test(JavaClass target) {
                    return target.getPackageName().contains(".application.")
                            && !target.getPackageName().contains(".application.shared");
                }
            })
            .allowEmptyShould(true);

    // 6. 컨트롤러는 저장소·조회 포트를 직접 의존하지 않는다
    @ArchTest
    static final ArchRule 컨트롤러는_데이터접근을_직접_의존하지_않는다 = noClasses()
            .that()
            .haveSimpleNameEndingWith("Controller")
            .should()
            .dependOnClassesThat()
            .haveSimpleNameEndingWith("Repository")
            .orShould()
            .dependOnClassesThat()
            .haveSimpleNameEndingWith("Queries")
            .allowEmptyShould(true);

    // 8. common은 어떤 모듈도 참조하지 않는다 — 참조하면 바닥이 아니라 또 하나의 모듈이 된다 (§2)
    @ArchTest
    static final ArchRule common은_모듈을_모른다 = noClasses()
            .that()
            .resideInAPackage(ROOT + ".common..")
            .should()
            .dependOnClassesThat(new DescribedPredicate<JavaClass>("모듈 패키지에 속한다") {
                @Override
                public boolean test(JavaClass target) {
                    return moduleOf(target) != null;
                }
            })
            .allowEmptyShould(true);

    // 7. 명령 서비스는 조회 포트를 의존하지 않는다 (docs/references/조회와-명령.md §3·§4)
    @ArchTest
    static final ArchRule 명령서비스는_조회포트를_의존하지_않는다 = noClasses()
            .that()
            .haveSimpleNameEndingWith("Service")
            .and()
            .haveSimpleNameNotEndingWith("QueryService")
            .should()
            .dependOnClassesThat()
            .haveSimpleNameEndingWith("Queries")
            .allowEmptyShould(true);

    /** 모듈 = 루트의 직계 하위 패키지. 루트 직속 클래스나 규칙 대상 밖 패키지는 null. */
    private static String moduleOf(JavaClass javaClass) {
        String packageName = javaClass.getPackageName();
        if (!packageName.startsWith(ROOT + ".")) {
            return null;
        }
        String rest = packageName.substring(ROOT.length() + 1);
        int dot = rest.indexOf('.');
        String module = dot < 0 ? rest : rest.substring(0, dot);
        return NOT_MODULES.contains(module) ? null : module;
    }

    /** 모듈 루트 직계가 아니면 internal이다. */
    private static boolean isInternal(JavaClass javaClass, String module) {
        return !javaClass.getPackageName().equals(ROOT + "." + module);
    }
}
