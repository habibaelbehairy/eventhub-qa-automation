import type { FullResult, Reporter, Suite } from '@playwright/test/reporter';

/**
 * Prints one summary line at the end of a run, so the known defects are visible in the terminal and in CI:
 * a `test.fail(...)` test that fails as expected is counted as "passed" by Playwright.
 * It only prints; the list and HTML reporters are unchanged.
 */
export default class ExpectedFailuresReporter implements Reporter {
  private suite!: Suite;

  onBegin(_config: unknown, suite: Suite): void {
    this.suite = suite;
  }

  onEnd(_result: FullResult): void {
    const tests = this.suite.allTests();
    const expectedFailures = tests.filter((t) => t.expectedStatus === 'failed' && t.outcome() === 'expected');
    const fixedBugs = tests.filter((t) => t.expectedStatus === 'failed' && t.outcome() === 'unexpected');
    if (expectedFailures.length === 0 && fixedBugs.length === 0) return;

    const passed = tests.filter((t) => t.outcome() === 'expected').length;
    console.log('');
    console.log(`Known defects: ${expectedFailures.length} of the ${passed} passed tests are expected failures (@xfail, test.fail).`);
    for (const t of expectedFailures) console.log(`  - ${t.titlePath().slice(2).join(' > ')}`);
    for (const t of fixedBugs) console.log(`  ! ${t.titlePath().slice(2).join(' > ')} now passes: the defect may be fixed, remove its test.fail marker.`);
  }

  printsToStdio(): boolean {
    return false;
  }
}
