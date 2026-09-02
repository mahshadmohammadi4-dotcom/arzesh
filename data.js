var DB = null;

function uid(){ return Math.random().toString(36).slice(2,10); }

var DOC_CATALOG = {
  legal:{ label:'اسناد حقوقی', items:['اساسنامه','جواز تأسیس / پروانه بهره‌برداری','روزنامه رسمی و آگهی تغییرات','اعتبارسنجی اشخاص حقیقی و حقوقی (API)','اطلاعات سهامداران و هیئت‌مدیره'] },
  financial:{ label:'اسناد مالی', items:['صورت‌های مالی','تراز آزمایشی','اظهارنامه مالیاتی','اظهارنامه ارزش افزوده','اکسل سامانه مؤدیان','لیست بیمه (API)'] },
  technical:{ label:'اسناد فنی', items:['رزومه / کاتالوگ شرکت / کاتالوگ محصولات','مجوزها و تاییدیه‌های فنی و کیفی شرکت','اسناد هزینه ماشین‌آلات، تجهیزات و مواد اولیه لازم'] },
  auxiliary:{ label:'اسناد کمکی', items:['گزارش بازار','گزارش امکان‌سنجی','طرح تجاری','گزارش ارزش‌گذاری'] }
};
function seedDocs(pid, uploadedCounts){
  var now = new Date('2026-07-22T09:00:00');
  function daysAgo(n){ var d=new Date(now); d.setDate(d.getDate()-n); return d; }
  var out = {};
  Object.keys(DOC_CATALOG).forEach(function(cat){
    var n = (uploadedCounts && uploadedCounts[cat]!=null) ? uploadedCounts[cat] : 1;
    out[cat] = DOC_CATALOG[cat].items.map(function(name, i){
      return i < n
        ? { name:name, status:'UPLOADED', by:'uploader', at:daysAgo(9-i) }
        : { name:name, status:'PENDING', by:null, at:null };
    });
  });
  DB.documents[pid] = out;
  DB.documentProcessing[pid] = {

status:"READY",

fileName:null,

extractedFields:0,

conflicts:0,

lastAction:null

};
}

function seed(){
  var now = new Date('2026-07-22T09:00:00');
  function daysAgo(n){ var d=new Date(now); d.setDate(d.getDate()-n); return d; }

  DB = {
    account:{ name:'هلدینگ رهبران', pkg:'هلدینگ / گروه', pkgKey:'holding', quotas:{ BUSINESS_ANALYSIS:{used:1,total:10}, FEASIBILITY_STUDY:{used:2,total:3}, VALUATION_REPORT:{used:2,total:3} } },
    authAccount:{ email:'najm', password:'najm123' },
    people:{
      admin:{ name:'رضا توکلی', role:'مدیر سامانه', capRole:'admin', quotaAllocation:null },
      pm:{ name:'آرمین کاظمی', role:'مدیر پروژه', capRole:'pm', quotaAllocation:{ BUSINESS_ANALYSIS:5, FEASIBILITY_STUDY:3, VALUATION_REPORT:3 } },
      consultant:{ name:'مهسا رستمی', role:'مشاور', capRole:'consultant', quotaAllocation:null },
      uploader:{ name:'یاسین فلاحی', role:'بارگذاری اطلاعات', capRole:'uploader', quotaAllocation:null },
      approver:{ name:'الهام کریمی', role:'تأییدکننده', capRole:'approver', quotaAllocation:null },
      viewer:{ name:'نیلوفر صادقی', role:'مشاهده‌گر', capRole:'viewer', quotaAllocation:null }
    },
    companies:{ rasad:{ name:'رصد', group:'رهبران' }, rasa:{ name:'رسا', group:'رهبران' } },
    groups:['رهبران'],
    projects:{},
    watchlists:{},
    tocTemplates:[],
    defaultTocTemplates:{ BUSINESS_ANALYSIS:null, FEASIBILITY_STUDY:null, VALUATION_REPORT:null },
    documents:{},
    documentProcessing:{}
  };

  function field(label, dataType, values, pinnedId){
    return { label:label, dataType:dataType, values:values, pinnedId: pinnedId || null };
  }
  function val(source, value, opts){
    opts = opts || {};
    return Object.assign({ id:uid(), source:source, value:value, at:opts.at || now, confidence:opts.confidence }, {});
  }

  /* ---------------- Business Analysis — رصد ---------------- */
  var ocrCapital = val('DOCUMENT_OCR', 900000000, { at:daysAgo(9), confidence:0.62 });
  var manualCapital = val('MANUAL_ENTRY', 1000000000, { at:daysAgo(8) });
  DB.projects['ba-rasad'] = {
    id:'ba-rasad', name:'تحلیل کسب‌وکار — شرکت رصد', type:'BUSINESS_ANALYSIS', companyKey:'rasad', createdBy:'pm',
    members:[ {p:'pm'}, {p:'consultant'}, {p:'uploader'}, {p:'approver'}, {p:'viewer'} ],
    pinned:true,
    sourcePriorityOverride:null,
    fields:{
      'company.registeredCapital': field('سرمایه ثبتی', 'NUMBER', [ocrCapital, manualCapital], manualCapital.id),
      'company.nationalId': field(
  'شناسه ملی',
  'STRING',
  [
    val(
      'EXTERNAL_API',
      '14001234567',
      {
        at:daysAgo(7),
        confidence:0.97
      }
    )
  ]
),

'company.registrationNo': field(
  'شماره ثبت',
  'STRING',
  [
    val(
      'DOCUMENT_OCR',
      '48219',
      {
        at:daysAgo(8),
        confidence:0.91
      }
    )
  ]
),

'company.employeeCount': field(
  'تعداد نیروی انسانی',
  'NUMBER',
  [
    val(
      'DOCUMENT_OCR',
      84,
      {
        at:daysAgo(6),
        confidence:0.74
      }
    ),

    val(
      'AI_SUGGESTED',
      80,
      {
        at:daysAgo(5),
        confidence:0.58
      }
    )
  ]
),

'company.activitySummary': field(
  'شرح کوتاه فعالیت',
  'STRING',
  [
    val(
      'AI_SUGGESTED',
      'فعالیت در حوزه تولید و عرضه محصولات صنعتی و ارائه خدمات مرتبط',
      {
        at:daysAgo(4),
        confidence:0.81
      }
    )
  ]
),
      'company.ceoName': field('مدیرعامل', 'STRING', [ val('MANUAL_ENTRY','سارا احمدی',{at:daysAgo(8)}) ]),
      'financials.revenueCurrentYear': field('درآمد سال جاری', 'NUMBER', [ val('MANUAL_ENTRY',1200000000,{at:daysAgo(7)}) ]),
      'financials.revenuePriorYear': field('درآمد سال قبل', 'NUMBER', [ val('MANUAL_ENTRY',1000000000,{at:daysAgo(7)}) ]),
      'financials.grossProfit': field('سود ناخالص', 'NUMBER', [ val('MANUAL_ENTRY',420000000,{at:daysAgo(7)}) ]),
      'financials.operatingProfit': field('سود عملیاتی', 'NUMBER', [ val('MANUAL_ENTRY',300000000,{at:daysAgo(7)}) ]),
      'financials.netProfit': field('سود خالص', 'NUMBER', [ val('MANUAL_ENTRY',180000000,{at:daysAgo(7)}) ]),
      'financials.currentAssets': field('دارایی جاری', 'NUMBER', [ val('MANUAL_ENTRY',600000000,{at:daysAgo(7)}) ]),
      'financials.currentLiabilities': field('بدهی جاری', 'NUMBER', [ val('MANUAL_ENTRY',300000000,{at:daysAgo(7)}) ]),
      'financials.inventory': field('موجودی کالا', 'NUMBER', [ val('MANUAL_ENTRY',220000000,{at:daysAgo(7)}) ]),
      'financials.totalAssets': field('کل دارایی‌ها', 'NUMBER', [ val('MANUAL_ENTRY',1400000000,{at:daysAgo(7)}) ]),
      'financials.totalLiabilities': field('کل بدهی‌ها', 'NUMBER', [ val('MANUAL_ENTRY',700000000,{at:daysAgo(7)}) ]),
      'financials.totalEquity': field('حقوق صاحبان سهام', 'NUMBER', [ val('MANUAL_ENTRY',700000000,{at:daysAgo(7)}) ])
    },
    kpiState:{}, pages:{},
    report:{ title:'گزارش تحلیل کسب‌وکار — رصد', pageKeys:['company_overview','financial_data','executive_summary','risk_analysis'],
      approvers:[ { person:'approver', placement:'ALL_PAGES', approvedAt:daysAgo(1) } ], externalApprovers:[], comments:[] },
    plan:null
  };

  /* ---------------- Feasibility Study — رصد ---------------- */
  function fsFields(inv, rate, cfs, actuals){
    var f = {
      'meta.reportTitle': field('عنوان طرح','STRING',[]),
      'meta.industrySector': field('حوزه صنعتی','STRING',[]),
      'meta.reportGoal': field('هدف گزارش','STRING',[]),
      'meta.location': field('محل اجرا','STRING',[]),
      'feasibility.initialInvestment': field('سرمایه‌گذاری اولیه','NUMBER',[val('MANUAL_ENTRY',inv,{at:daysAgo(6)})]),
      'feasibility.discountRate': field('نرخ تنزیل','NUMBER',[val('MANUAL_ENTRY',rate,{at:daysAgo(6)})])
    };
    cfs.forEach(function(cf,i){ f['feasibility.cashFlowYear'+(i+1)] = field('جریان نقدی — سال '+(i+1),'NUMBER',[val('MANUAL_ENTRY',cf,{at:daysAgo(6)})]); });
    for (var y=1;y<=5;y++){
      var av = actuals && actuals[y-1]!=null ? actuals[y-1] : null;
      f['feasibilityActuals.cashFlowYear'+y] = field('جریان نقدی واقعی — سال '+y, 'NUMBER', av!=null ? [val('MANUAL_ENTRY',av,{at:daysAgo(1)})] : []);
    }
    return f;
  }
  DB.projects['fs-rasad'] = {
    id:'fs-rasad', name:'امکان‌سنجی — شرکت رصد', type:'FEASIBILITY_STUDY', companyKey:'rasad', createdBy:'pm',
    members:[ {p:'pm'}, {p:'uploader'}, {p:'approver'}, {p:'viewer'} ],
    pinned:true,
    fields:fsFields(1000000000, 0.10, [200000000,300000000,300000000,400000000,500000000], [210000000,280000000]),
    kpiState:{}, pages:{},
    questionnaire:{ base:{ years:'۵ ساله', currency:'ریالی', sector:'تولید صنعتی', scale:'متوسط' } },
    sourcePriorityOverride:null,
    report:{ title:'گزارش امکان‌سنجی — رصد',
      pageKeys:['feasibility_cover_page','feasibility_report_meta','feasibility_disclaimer','feasibility_foundational_assumptions','feasibility_company_intro','feasibility_financial_and_ratios','feasibility_executive_summary','feasibility_risk_analysis'],
      approvers:[ { person:'approver', placement:'LAST_PAGE', approvedAt:null } ], externalApprovers:[],
      comments:[ { person:'viewer', body:'پیش‌بینی جریان نقدی سال پنجم کمی خوش‌بینانه به نظر می‌رسد؛ بهتر است دوباره بررسی شود.', at:daysAgo(2) } ] },
    plan:[
      { id:uid(), title:'اخذ تأیید سرمایه‌گذاری از هیئت‌مدیره', description:'ارائه مدل مالی نهایی به هیئت‌مدیره جهت اخذ مصوبه سرمایه‌گذاری.', dueDate:'۱۴۰۵/۰۶/۱۵', progress:40, assignee:'pm', kpi:'npv', attachments:['مدل-مالی-نهایی.xlsx'], children:[
        { id:uid(), title:'نهایی‌سازی پیش‌بینی جریان نقدی', description:'', dueDate:'۱۴۰۵/۰۵/۲۰', progress:60, assignee:'uploader', attachments:[], children:[
          { id:uid(), title:'اخذ استعلام قیمت تجهیزات از تأمین‌کنندگان', description:'', dueDate:'۱۴۰۵/۰۵/۱۰', progress:40, assignee:'uploader', attachments:['استعلام-تجهیزات.pdf'], children:[] }
        ] }
      ] }
    ],
    planStatus:'ACTIVE'
  };

  DB.projects['fs-rasa'] = {
    id:'fs-rasa', name:'امکان‌سنجی — شرکت رسا', type:'FEASIBILITY_STUDY', companyKey:'rasa', createdBy:'pm',
    members:[ {p:'pm'}, {p:'uploader'} ],
    pinned:false,
    fields:fsFields(600000000, 0.12, [150000000,180000000,200000000,220000000,250000000]),
    kpiState:{}, pages:{},
    questionnaire:{ base:{} },
    sourcePriorityOverride:null,
    report:{ title:'گزارش امکان‌سنجی — رسا', pageKeys:['feasibility_cover_page','feasibility_financial_and_ratios'],
      approvers:[], externalApprovers:[], comments:[] },
    plan:[
      { id:uid(), title:'بررسی میدانی سایت احداث', description:'', dueDate:'', progress:20, assignee:'uploader', attachments:[], children:[] },
      { id:uid(), title:'تدوین برنامه تأمین و خرید', description:'', dueDate:'', progress:0, assignee:'pm', kpi:'irr', attachments:[], children:[] }
    ],
    planStatus:null
  };

  /* ---------------- Valuation Report ---------------- */
  function valFields(rate, growth, netDebt, shares, cfs){
    var f = {
      'valuation.discountRate': field('نرخ تنزیل (WACC)','NUMBER',[val('MANUAL_ENTRY',rate,{at:daysAgo(4)})]),
      'valuation.terminalGrowthRate': field('نرخ رشد پایدار','NUMBER',[val('MANUAL_ENTRY',growth,{at:daysAgo(4)})]),
      'valuation.netDebt': field('بدهی خالص','NUMBER',[val('MANUAL_ENTRY',netDebt,{at:daysAgo(4)})]),
      'valuation.sharesOutstanding': field('تعداد سهام','NUMBER',[val('MANUAL_ENTRY',shares,{at:daysAgo(4)})])
    };
    cfs.forEach(function(cf,i){ f['valuation.freeCashFlowYear'+(i+1)] = field('جریان نقدی آزاد — سال '+(i+1),'NUMBER',[val('MANUAL_ENTRY',cf,{at:daysAgo(4)})]); });
    return f;
  }
  DB.projects['val-rasad'] = {
    id:'val-rasad', name:'ارزش‌گذاری — شرکت رصد', type:'VALUATION_REPORT', companyKey:'rasad', createdBy:'pm',
    members:[ {p:'pm'}, {p:'approver'} ],
    pinned:false,
    fields:Object.assign(valFields(0.15,0.04,150000000,1000000,[220000000,260000000,300000000]), {
      'macro.inflationRate': field('نرخ تورم','NUMBER',[val('EXTERNAL_API',0.35,{at:daysAgo(3),confidence:0.6})]),
      'macro.gdpGrowthRate': field('نرخ رشد اقتصادی','NUMBER',[val('EXTERNAL_API',0.025,{at:daysAgo(3),confidence:0.6})]),
      'ownership.majorShareholders': field('سهامداران عمده','STRING',[val('MANUAL_ENTRY','شرکت سرمایه‌گذاری رهبران (۶۰٪)، سهامداران خرد (۴۰٪)',{at:daysAgo(3)})])
    }),
    kpiState:{}, pages:{},
    questionnaire:{ base:{ method:'تنزیل جریان نقدی (DCF)', purpose:'انتقال مالکیت', valuationDate:'۱۴۰۵/۰۴/۰۱' } },
    sourcePriorityOverride:null,
    report:{ title:'گزارش ارزش‌گذاری — رصد', pageKeys:['valuation_cover_page','valuation_executive_summary','valuation_macro_ownership','valuation_dcf_summary'],
      approvers:[ { person:'approver', placement:'ALL_PAGES', approvedAt:null } ],
      externalApprovers:[ { id:uid(), name:'علی محمدی', contact:'a.mohammadi@example.com', method:'EMAIL_OTP', placement:'LAST_PAGE', approvedAt:null, token:'demo-ext-token-1' } ],
      comments:[] },
    plan:null
  };
  DB.projects['val-rasa'] = {
    id:'val-rasa', name:'ارزش‌گذاری — شرکت رسا', type:'VALUATION_REPORT', companyKey:'rasa', createdBy:'pm',
    members:[ {p:'pm'} ],
    pinned:false,
    fields:valFields(0.13,0.03,80000000,500000,[120000000,140000000,160000000]),
    kpiState:{}, pages:{},
    questionnaire:{ base:{} },
    sourcePriorityOverride:null,
    report:{ title:'گزارش ارزش‌گذاری — رسا', pageKeys:['valuation_cover_page','valuation_dcf_summary'], approvers:[], externalApprovers:[], comments:[] },
    plan:null
  };

  DB.watchlists['wl-fs'] = { id:'wl-fs', name:'مقایسه امکان‌سنجی', projectIds:['fs-rasad','fs-rasa'] };
  DB.watchlists['wl-val'] = { id:'wl-val', name:'مقایسه ارزش‌گذاری', projectIds:['val-rasad','val-rasa'] };

  seedDocs('ba-rasad', { legal:5, financial:6, technical:2, auxiliary:1 });
  seedDocs('fs-rasad', { legal:3, financial:4, technical:1, auxiliary:2 });
  seedDocs('fs-rasa', { legal:2, financial:2, technical:0, auxiliary:1 });
  seedDocs('val-rasad', { legal:5, financial:6, technical:3, auxiliary:3 });
  seedDocs('val-rasa', { legal:1, financial:1, technical:0, auxiliary:0 });

  /* پیش‌مقدار: محاسبه شاخص‌ها و تولید صفحات خروجی برای هر پروژه */
  Object.keys(DB.projects).forEach(function(pid){
    var p = DB.projects[pid];
    recomputeKpis(p);
    (p.report.pageKeys || []).forEach(function(pk){ generatePage(p, pk, 'سیستم (تولید اولیه)'); });
  });

  /* یک ویرایش دستیِ نمونه روی صفحه‌ی جلد امکان‌سنجی رصد، برای نمایش «ویرایش بلادرنگ» و بلوک‌های گزارش */
  editPageContent(DB.projects['fs-rasad'], 'feasibility_cover_page', {
    blocks:[
      { id:uid(), type:'table', width:'full', rows:[
        { label:'عنوان', value:'گزارش امکان‌سنجی طرح توسعه — شرکت رصد' },
        { label:'کارفرما', value:'هلدینگ رهبران' },
        { label:'تاریخ تهیه', value:'۱۴۰۵/۰۵/۰۱' }
      ] }
    ]
  }, 'آرمین کاظمی');
}
