import {
  GOLDEN_CASE_CONTRACT_VERSION,
  type GoldenCase,
} from '@/domains/golden/types';

const HKO_SOLAR_TERM_OVERVIEW = 'https://www.hko.gov.hk/tc/gts/astronomy/Solar_Term.htm';
const HKO_SOLAR_TERM_2024_XML = 'https://www.hko.gov.hk/tc/gts/astronomy/data/files/24SolarTerms_2024.xml';
const HKO_CALENDAR_CONVERSION = 'https://www.hko.gov.hk/sc/gts/time/conversion.htm';
const HKO_CALENDAR_2024_PDF = 'https://www.hko.gov.hk/tc/gts/time/calendar/pdf/files/2024.pdf';
const HKO_LICHUN_YEAR_BOUNDARY_NOTE = 'https://www.hko.gov.hk/sc/education/astronomy-and-time/time-service/00506-what-year-is-it-today.html';

const HKO_FIXTURE_REVIEWER = '观象项目 fixture review（对照香港天文台公开资料，非专业命理复核）';
const HKO_VERIFIED_AT = '2026-08-15';

/**
 * Public-reference cases are deliberately limited to facts published by HKO.
 * They do not turn the resolver output into a professional or school-specific
 * truth claim. The source precision is retained in expectedFacts so tests can
 * compare only what the public source actually states.
 */
export const HKO_PUBLISHED_REFERENCE_GOLDEN_CASES: readonly GoldenCase[] = [
  {
    contractVersion: GOLDEN_CASE_CONTRACT_VERSION,
    id: 'bazi-hko-2024-li-chun-minute',
    module: 'bazi',
    validationClass: 'independent-validation',
    input: {
      fixtureId: 'hko-2024-li-chun-minute',
      civilTime: '2024-02-04T16:27:07',
      timezone: 'Asia/Shanghai',
      publishedTimezone: 'UTC+8',
      purpose: '比较香港天文台发布的立春分钟与应用节气 resolver 的当前节令。',
    },
    calculationSettings: {
      timezone: 'Asia/Shanghai',
      engineVersion: 'taibu-core@3.4.0/bazi',
      solarTermResolverDataSource: '6tail/lunar-javascript',
      solarTermResolverDataVersion: '1.7.7',
      publishedReferencePrecision: 'minute',
    },
    sourceReferences: [
      {
        type: 'published-reference',
        locator: HKO_SOLAR_TERM_OVERVIEW,
        purpose: '香港天文台二十四节气说明；说明时间采用 UTC+8，并说明资料来源范围。',
      },
      {
        type: 'published-reference',
        locator: HKO_SOLAR_TERM_2024_XML,
        purpose: '香港天文台 2024 年二十四节气 XML；立春公开时刻为 2024-02-04 16:27。',
      },
      {
        type: 'published-reference',
        locator: HKO_LICHUN_YEAR_BOUNDARY_NOTE,
        purpose: '记录官方历法与部分命理爱好者以立春换年之间的说明边界。',
      },
    ],
    sourceType: 'published-reference',
    independentVerification: {
      status: 'verified',
      method: 'fixture review 对照香港天文台公开说明和 2024 节气 XML，再以现有 resolver 做离线分钟级比较。',
      scope: 'published-comparison',
      notes: '只验证公开节气时刻与应用在该分钟进入立春；不把应用解析出的秒值回写为官方精度。',
    },
    expectedFacts: {
      fixtureId: 'hko-2024-li-chun-minute',
      solarTerm: '立春',
      publishedLocalDate: '2024-02-04',
      publishedLocalTime: '16:27',
      publishedTimezone: 'UTC+8',
      publishedPrecision: 'minute',
      resolverProbe: {
        civilTime: '2024-02-04T16:27:07',
        expectedCurrentTerm: '立春',
        expectedMonthBranch: '寅',
        scope: 'application-resolver-only',
      },
      assertionScope: '公开天文节气时刻与当前节令比较；不验证八字流派换年、月柱或命理结论。',
    },
    expectedEvidence: {
      fixtureLocation: 'tests/golden-published-reference.regression.mjs#HKO 2024 立春分钟级 published-reference',
      assertions: [
        'hko-published-local-minute-matches-resolver-term-minute',
        'resolver-enters-li-chun-in-published-minute',
        'published-source-does-not-verify-application-second',
      ],
      sourcePrecision: 'minute',
    },
    expectedInterpretation: {
      notProfessionalTruth: true,
      scope: 'published-comparison',
      assertion: 'no-bazi-school-or-fate-conclusion',
    },
    knownDisputes: [
      '香港天文台公开节气时刻只发布到分钟；本条不把应用解析出的 16:27:07 秒值宣称为 HKO 官方验证。',
      '本条只验证公开节气时刻与应用当前节令，不验证八字流派的立春换年、月柱或任何命理结论。',
    ],
    verifiedBy: HKO_FIXTURE_REVIEWER,
    verifiedAt: HKO_VERIFIED_AT,
  },
  {
    contractVersion: GOLDEN_CASE_CONTRACT_VERSION,
    id: 'bazi-hko-2024-lunar-new-year-date',
    module: 'bazi',
    validationClass: 'independent-validation',
    input: {
      fixtureId: 'hko-2024-lunar-new-year-date',
      calendar: 'lunar',
      lunarDate: '2024-01-01',
      lunarTime: '12:00',
      isLeapMonth: false,
      timezone: 'Asia/Shanghai',
      purpose: '比较香港天文台发布的农历日期对照，不把日期映射扩展为四柱流派结论。',
    },
    calculationSettings: {
      timezone: 'Asia/Shanghai',
      engineVersion: 'taibu-core@3.4.0/bazi',
      calendarResolverDataSource: '6tail/lunar-javascript',
      calendarResolverDataVersion: '1.7.7',
      publishedReferencePrecision: 'day',
    },
    sourceReferences: [
      {
        type: 'published-reference',
        locator: HKO_CALENDAR_CONVERSION,
        purpose: '香港天文台公历/农历对照入口，作为公开日期换算资料入口。',
      },
      {
        type: 'published-reference',
        locator: HKO_CALENDAR_2024_PDF,
        purpose: '香港天文台 2024 年公历/农历对照表；2024-02-10 对应农历正月初一。',
      },
      {
        type: 'published-reference',
        locator: HKO_LICHUN_YEAR_BOUNDARY_NOTE,
        purpose: '记录官方历法与部分命理流派以立春换年之间的说明边界。',
      },
    ],
    sourceType: 'published-reference',
    independentVerification: {
      status: 'verified',
      method: 'fixture review 对照香港天文台 2024 年公历/农历对照表，再以现有 calendar calculation 离线复现日期映射。',
      scope: 'published-comparison',
      notes: '只验证农历日期到公历日期的映射；不验证八字年柱、月柱或任何流派真值。',
    },
    expectedFacts: {
      fixtureId: 'hko-2024-lunar-new-year-date',
      sourceCalendar: 'lunar',
      lunarDate: '2024-01-01',
      lunarTime: '12:00',
      expectedSolarDate: '2024-02-10',
      expectedSolarTime: '12:00:00',
      publishedPrecision: 'day',
      assertionScope: '只验证农历 2024 正月初一对应公历 2024-02-10；不验证八字年/月柱流派。',
    },
    expectedEvidence: {
      fixtureLocation: 'tests/golden-published-reference.regression.mjs#HKO 2024 农历正月初一日期 published-reference',
      assertions: [
        'lunar-input-is-retained-in-calendar-evidence',
        'published-solar-date-matches-calendar-resolver',
        'time-is-retained-for-reproducible-probe-but-source-claim-is-date-only',
      ],
      sourcePrecision: 'day',
    },
    expectedInterpretation: {
      notProfessionalTruth: true,
      scope: 'published-comparison',
      assertion: 'no-four-pillars-school-conclusion',
    },
    knownDisputes: [
      '本条只验证农历 2024 正月初一到公历 2024-02-10 的日期映射，不验证八字年柱、月柱或流派结论。',
      '香港天文台说明官方历法与部分命理爱好者以立春换年存在差异；不能由日期映射推导四柱流派真值。',
    ],
    verifiedBy: HKO_FIXTURE_REVIEWER,
    verifiedAt: HKO_VERIFIED_AT,
  },
];
