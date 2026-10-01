export type RiskLevel = 'Normal' | 'Moderate Watch' | 'High Priority Inspection';

export type InspectionStatus =
  | 'Scheduled'
  | 'In Progress'
  | 'Verified Today'
  | 'Overdue'
  | 'Action Required';

export type UserRole = 'GOVERNMENT_AUTHORITY' | 'NGO_HEAD' | 'FIELD_OFFICER';

export interface UserSession {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  designation: string;
  departmentOrNgo: string;
  assignedNgoId?: string; // Present ONLY when role === 'NGO_HEAD'
  accountType?: 'Pre-provisioned Government Authority' | 'Government-provisioned NGO Head' | 'Government-provisioned Field Officer';
}

export interface NGO {
  id: string;
  name: string;
  darpanRegNo: string;
  panNumber: string;
  nodalPerson: {
    name: string;
    designation: string;
    phone: string;
    email: string;
  };
  status: 'Active' | 'Under Review' | 'Suspended';
  complianceScore: number; // 0 to 100
  registeredSince: string;
  registeredOffice: string;
}

export interface GovernmentWelfareProject {
  id: string;
  ngoId: string;
  projectCode: string;
  schemeName: string;
  sanctionOrderNo: string;
  financialYear: string;
  serviceType: 'Subsidized Meals' | 'Shelter Nutrition' | 'Day Care Outreach';
  targetDailyBeneficiaries: number;
  sanctionedBudget: number; // INR
  releasedBudget: number; // INR
  spentBudget: number; // INR
  financialAuditStatus: 'Reconciled' | 'Under Review' | 'Audit Pending';
  validFrom: string;
  validUntil: string;
  status: 'Operational' | 'Renewal Pending' | 'Suspended';
}

export interface WelfareCenter {
  id: string;
  projectId: string;
  ngoId: string;
  code: string;
  name: string;
  district: string;
  state: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  geofenceRadiusMeters: number;
  beneficiaryCapacity: number;
  cctvCameraCount: number;
  cctvStreamStatus: 'Active' | 'Intermittent' | 'Offline';
  status: 'Operational' | 'Temporarily Closed' | 'Under Inspection';
}

// Operational Center interface (backward-compatible with Milestone 1 Command Center)
export interface WelfareProject {
  id: string;
  code: string;
  name: string;
  ngoId: string;
  ngoName: string;
  ngoRegNo: string;
  projectId: string;
  projectCode: string;
  schemeName: string;
  district: string;
  state: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  geofenceRadiusMeters: number;
  beneficiaryCapacity: number;
  todayVerifiedCount: number;
  todayMealTransactions: number;
  todayMealViolationsBlocked: number; // 3rd-meal visit attempts blocked
  operationalRiskScore: number; // 0.00 to 1.00 (Rule-based operational & compliance score)
  aiAnomalyScore?: number; // Optional alias for backward compatibility
  riskLevel: RiskLevel;
  riskContributingFactors: string[];
  lastVerificationTime: string;
  inspectionStatus: InspectionStatus;
  assignedOfficer: string | null;
  sha256EvidenceHash: string;
  cctvStreamStatus: 'Active' | 'Intermittent' | 'Offline';
  // Financial link
  sanctionedBudget: number;
  releasedBudget: number;
  spentBudget: number;
}

export interface AIAnomalyItem {
  id: string;
  projectId: string;
  projectName: string;
  ngoName: string;
  district: string;
  timestamp: string;
  anomalyType: string;
  severity: 'High' | 'Medium' | 'Low';
  description: string;
  recommendedAction: string;
  modelSource: string;
}

export interface KPISummary {
  activeProjects: number;
  ngosUnderMonitoring: number;
  dailyMealTransactions: number;
  highRiskProjects: number;
  activeFieldInspections: number;
  mealsDeniedAttempt3: number;
  systemHealthStatus: string;
  lastSyncTimestamp: string;
  // Financial aggregations
  totalSanctionedBudget: number;
  totalReleasedBudget: number;
  totalSpentBudget: number;
  totalRemainingReleasedBudget: number;
  aggregateUtilizationPercentage: number;
}

// Helper for accurate budget utilization calculation
export function calculateFinancials(releasedBudget: number, spentBudget: number) {
  const remainingReleasedBudget = releasedBudget - spentBudget;
  const utilizationPercentage = releasedBudget > 0 ? (spentBudget / releasedBudget) * 100 : 0;
  return { remainingReleasedBudget, utilizationPercentage };
}

// Synthetic Demo User Accounts for prototype role switching
export const DEMO_USERS: UserSession[] = [
  {
    userId: 'usr-gov-01',
    name: 'Dr. R. K. Verma',
    email: 'director@msje-demo.gov.in',
    role: 'GOVERNMENT_AUTHORITY',
    accountType: 'Pre-provisioned Government Authority',
    designation: 'Joint Secretary & Monitoring Director',
    departmentOrNgo: 'Ministry of Social Justice & Empowerment'
  },
  {
    userId: 'usr-ngo-01',
    name: 'Alok Bansal',
    email: 'head@sahyog-demo.org',
    role: 'NGO_HEAD',
    accountType: 'Government-provisioned NGO Head',
    designation: 'General Secretary',
    departmentOrNgo: 'Sahyog Seva Samiti',
    assignedNgoId: 'ngo-01'
  },
  {
    userId: 'usr-ngo-02',
    name: 'Sunita Goel',
    email: 'head@pragati-demo.org',
    role: 'NGO_HEAD',
    accountType: 'Government-provisioned NGO Head',
    designation: 'Executive Trustee',
    departmentOrNgo: 'Pragati Welfare Foundation',
    assignedNgoId: 'ngo-02'
  },
  {
    userId: 'usr-insp-01',
    name: 'Devendra Sharma',
    email: 'inspector.delhi@msje-demo.gov.in',
    role: 'FIELD_OFFICER',
    accountType: 'Government-provisioned Field Officer',
    designation: 'Senior Field Inspection Officer (Badge: GOV-DL-041)',
    departmentOrNgo: 'Central Monitoring & Inspection Directorate'
  }
];

export const DEMO_NGOS: NGO[] = [
  {
    id: 'ngo-01',
    name: 'Sahyog Seva Samiti',
    darpanRegNo: 'DL/2019/0482-NGO',
    panNumber: 'AAATS1234D',
    nodalPerson: {
      name: 'Alok Bansal',
      designation: 'General Secretary',
      phone: '+91 98110 44219',
      email: 'contact@sahyog-demo.org'
    },
    status: 'Active',
    complianceScore: 94,
    registeredSince: '2019-04-15',
    registeredOffice: 'Plot 14, Community Center, Paharganj, New Delhi - 110055'
  },
  {
    id: 'ngo-02',
    name: 'Pragati Welfare Foundation',
    darpanRegNo: 'DL/2018/1192-NGO',
    panNumber: 'AABCP5678F',
    nodalPerson: {
      name: 'Sunita Goel',
      designation: 'Executive Trustee',
      phone: '+91 98182 99014',
      email: 'director@pragati-demo.org'
    },
    status: 'Active',
    complianceScore: 82,
    registeredSince: '2018-08-22',
    registeredOffice: 'B-42, Okhla Industrial Area Phase-II, New Delhi - 110020'
  },
  {
    id: 'ngo-03',
    name: 'Vishwa Shanti Mission Trust',
    darpanRegNo: 'DL/2017/0931-NGO',
    panNumber: 'AAATV9012K',
    nodalPerson: {
      name: 'Harish Chander',
      designation: 'Managing Trustee',
      phone: '+91 99105 12830',
      email: 'admin@vshanti-demo.org'
    },
    status: 'Under Review',
    complianceScore: 68,
    registeredSince: '2017-02-10',
    registeredOffice: '88, Shivaji Enclave, Tilak Nagar, New Delhi - 110018'
  },
  {
    id: 'ngo-04',
    name: 'Kalyan Bharti Trust',
    darpanRegNo: 'DL/2021/0745-NGO',
    panNumber: 'AAACK3456L',
    nodalPerson: {
      name: 'Meenakshi Joshi',
      designation: 'Project Director',
      phone: '+91 98731 66450',
      email: 'info@kalyanbharti-demo.org'
    },
    status: 'Active',
    complianceScore: 97,
    registeredSince: '2021-06-18',
    registeredOffice: '12-A, Vikas Marg, Laxmi Nagar, New Delhi - 110092'
  },
  {
    id: 'ngo-05',
    name: 'Ekta Vikas Parishad',
    darpanRegNo: 'DL/2020/0319-NGO',
    panNumber: 'AAATE7890M',
    nodalPerson: {
      name: 'Rajesh Khurana',
      designation: 'Honorary Secretary',
      phone: '+91 98101 22345',
      email: 'secretary@ektavikas-demo.org'
    },
    status: 'Active',
    complianceScore: 91,
    registeredSince: '2020-03-12',
    registeredOffice: 'Sector 3 Institutional Area, Rohini, New Delhi - 110085'
  },
  {
    id: 'ngo-06',
    name: 'Gram Seva Sangathan',
    darpanRegNo: 'DL/2016/1844-NGO',
    panNumber: 'AAATG2345N',
    nodalPerson: {
      name: 'Virender Singh',
      designation: 'Convenor',
      phone: '+91 99990 77112',
      email: 'gramseva@najafgarh-demo.org'
    },
    status: 'Active',
    complianceScore: 78,
    registeredSince: '2016-11-05',
    registeredOffice: 'Main Dhansa Road, Najafgarh, New Delhi - 110043'
  }
];

export const DEMO_GOV_PROJECTS: GovernmentWelfareProject[] = [
  {
    id: 'prj-scheme-01',
    ngoId: 'ngo-01',
    projectCode: 'MSJE-DSAS-2026-08',
    schemeName: 'Deendayal Subsidized Urban Nutrition Initiative',
    sanctionOrderNo: 'SO/2025/MSJE/4910',
    financialYear: '2025-26',
    serviceType: 'Subsidized Meals',
    targetDailyBeneficiaries: 1200,
    sanctionedBudget: 5000000, // ₹50 Lakh
    releasedBudget: 3500000,   // ₹35 Lakh
    spentBudget: 2750000,      // ₹27.5 Lakh
    financialAuditStatus: 'Reconciled',
    validFrom: '2025-04-01',
    validUntil: '2026-03-31',
    status: 'Operational'
  },
  {
    id: 'prj-scheme-02',
    ngoId: 'ngo-02',
    projectCode: 'MSJE-ACSP-2026-14',
    schemeName: 'Antyodaya Community Sustenance Program',
    sanctionOrderNo: 'SO/2025/MSJE/5102',
    financialYear: '2025-26',
    serviceType: 'Subsidized Meals',
    targetDailyBeneficiaries: 1500,
    sanctionedBudget: 6000000, // ₹60 Lakh
    releasedBudget: 4200000,   // ₹42 Lakh
    spentBudget: 3100000,      // ₹31 Lakh
    financialAuditStatus: 'Under Review',
    validFrom: '2025-04-01',
    validUntil: '2026-03-31',
    status: 'Operational'
  },
  {
    id: 'prj-scheme-03',
    ngoId: 'ngo-03',
    projectCode: 'MSJE-UDFM-2026-21',
    schemeName: 'Urban Destitute Food Security Mission',
    sanctionOrderNo: 'SO/2025/MSJE/4489',
    financialYear: '2025-26',
    serviceType: 'Subsidized Meals',
    targetDailyBeneficiaries: 900,
    sanctionedBudget: 4000000, // ₹40 Lakh
    releasedBudget: 2800000,   // ₹28 Lakh
    spentBudget: 2450000,      // ₹24.5 Lakh
    financialAuditStatus: 'Audit Pending',
    validFrom: '2025-04-01',
    validUntil: '2026-03-31',
    status: 'Operational'
  },
  {
    id: 'prj-scheme-04',
    ngoId: 'ngo-04',
    projectCode: 'MSJE-MNOS-2026-05',
    schemeName: 'Matoshree Nutrition Outreach Scheme',
    sanctionOrderNo: 'SO/2025/MSJE/4211',
    financialYear: '2025-26',
    serviceType: 'Subsidized Meals',
    targetDailyBeneficiaries: 1000,
    sanctionedBudget: 4500000, // ₹45 Lakh
    releasedBudget: 3200000,   // ₹32 Lakh
    spentBudget: 2200000,      // ₹22 Lakh
    financialAuditStatus: 'Reconciled',
    validFrom: '2025-04-01',
    validUntil: '2026-03-31',
    status: 'Operational'
  },
  {
    id: 'prj-scheme-05',
    ngoId: 'ngo-05',
    projectCode: 'MSJE-GPUA-2026-33',
    schemeName: 'Gramin & Peri-Urban Aahar Yojana',
    sanctionOrderNo: 'SO/2025/MSJE/5670',
    financialYear: '2025-26',
    serviceType: 'Subsidized Meals',
    targetDailyBeneficiaries: 1300,
    sanctionedBudget: 5500000, // ₹55 Lakh
    releasedBudget: 3900000,   // ₹39 Lakh
    spentBudget: 2800000,      // ₹28 Lakh
    financialAuditStatus: 'Reconciled',
    validFrom: '2025-04-01',
    validUntil: '2026-03-31',
    status: 'Operational'
  },
  {
    id: 'prj-scheme-06',
    ngoId: 'ngo-06',
    projectCode: 'MSJE-RBBS-2026-19',
    schemeName: 'Rural Border Belt Sustenance Drive',
    sanctionOrderNo: 'SO/2025/MSJE/3981',
    financialYear: '2025-26',
    serviceType: 'Subsidized Meals',
    targetDailyBeneficiaries: 800,
    sanctionedBudget: 3500000, // ₹35 Lakh
    releasedBudget: 2400000,   // ₹24 Lakh
    spentBudget: 1850000,      // ₹18.5 Lakh
    financialAuditStatus: 'Reconciled',
    validFrom: '2025-04-01',
    validUntil: '2026-03-31',
    status: 'Operational'
  }
];

export const DEMO_WELFARE_CENTERS: WelfareCenter[] = [
  {
    id: 'cnt-01',
    projectId: 'prj-scheme-01',
    ngoId: 'ngo-01',
    code: 'DL-ND-2026-084',
    name: 'Annapurna Rasoi Kendra - Paharganj',
    district: 'Central Delhi',
    state: 'NCT of Delhi',
    address: 'Near Old Railway Station, Paharganj, New Delhi - 110055',
    coordinates: { lat: 28.6415, lng: 77.2144 },
    geofenceRadiusMeters: 75,
    beneficiaryCapacity: 500,
    cctvCameraCount: 4,
    cctvStreamStatus: 'Active',
    status: 'Operational'
  },
  {
    id: 'cnt-02',
    projectId: 'prj-scheme-02',
    ngoId: 'ngo-02',
    code: 'DL-SD-2026-041',
    name: 'Jan Poshan Aahar Kendra - Okhla Ph-II',
    district: 'South Delhi',
    state: 'NCT of Delhi',
    address: 'Phase-II Industrial Welfare Complex, Okhla, New Delhi - 110020',
    coordinates: { lat: 28.5284, lng: 77.2763 },
    geofenceRadiusMeters: 100,
    beneficiaryCapacity: 650,
    cctvCameraCount: 3,
    cctvStreamStatus: 'Intermittent',
    status: 'Operational'
  },
  {
    id: 'cnt-03',
    projectId: 'prj-scheme-03',
    ngoId: 'ngo-03',
    code: 'DL-WD-2026-092',
    name: 'Vishwa Shanti Bhojanalaya - Tilak Nagar',
    district: 'West Delhi',
    state: 'NCT of Delhi',
    address: 'Subhash Nagar Roundabout, Tilak Nagar, New Delhi - 110018',
    coordinates: { lat: 28.6366, lng: 77.0963 },
    geofenceRadiusMeters: 60,
    beneficiaryCapacity: 400,
    cctvCameraCount: 2,
    cctvStreamStatus: 'Offline',
    status: 'Operational'
  },
  {
    id: 'cnt-04',
    projectId: 'prj-scheme-04',
    ngoId: 'ngo-04',
    code: 'DL-ED-2026-015',
    name: 'Matoshree Community Kitchen - Laxmi Nagar',
    district: 'East Delhi',
    state: 'NCT of Delhi',
    address: 'Near Metro Pillar 42, Vikas Marg, Laxmi Nagar, New Delhi - 110092',
    coordinates: { lat: 28.6318, lng: 77.2776 },
    geofenceRadiusMeters: 80,
    beneficiaryCapacity: 450,
    cctvCameraCount: 4,
    cctvStreamStatus: 'Active',
    status: 'Operational'
  },
  {
    id: 'cnt-05',
    projectId: 'prj-scheme-05',
    ngoId: 'ngo-05',
    code: 'DL-NW-2026-063',
    name: 'Deendayal Antyodaya Kendra - Rohini Sec-3',
    district: 'North West Delhi',
    state: 'NCT of Delhi',
    address: 'Pocket D, Community Hub, Sector 3, Rohini, New Delhi - 110085',
    coordinates: { lat: 28.7041, lng: 77.1025 },
    geofenceRadiusMeters: 75,
    beneficiaryCapacity: 600,
    cctvCameraCount: 3,
    cctvStreamStatus: 'Active',
    status: 'Operational'
  },
  {
    id: 'cnt-06',
    projectId: 'prj-scheme-06',
    ngoId: 'ngo-06',
    code: 'DL-SW-2026-037',
    name: 'Gramin Poshan Seva Kendra - Najafgarh',
    district: 'South West Delhi',
    state: 'NCT of Delhi',
    address: 'Opp. BDO Complex, Main Najafgarh Road, New Delhi - 110043',
    coordinates: { lat: 28.6092, lng: 76.9854 },
    geofenceRadiusMeters: 90,
    beneficiaryCapacity: 350,
    cctvCameraCount: 2,
    cctvStreamStatus: 'Active',
    status: 'Operational'
  }
];

// Aggregations
const initialSanctioned = DEMO_GOV_PROJECTS.reduce((acc, p) => acc + p.sanctionedBudget, 0);
const initialReleased = DEMO_GOV_PROJECTS.reduce((acc, p) => acc + p.releasedBudget, 0);
const initialSpent = DEMO_GOV_PROJECTS.reduce((acc, p) => acc + p.spentBudget, 0);
const initialFinancials = calculateFinancials(initialReleased, initialSpent);

export const DEMO_KPI_SUMMARY: KPISummary = {
  activeProjects: 48,
  ngosUnderMonitoring: 32,
  dailyMealTransactions: 14820,
  highRiskProjects: 6,
  activeFieldInspections: 11,
  mealsDeniedAttempt3: 89,
  systemHealthStatus: 'Prototype Demo Environment (Simulated GovNet)',
  lastSyncTimestamp: 'Just now (12s ago)',
  totalSanctionedBudget: initialSanctioned,
  totalReleasedBudget: initialReleased,
  totalSpentBudget: initialSpent,
  totalRemainingReleasedBudget: initialFinancials.remainingReleasedBudget,
  aggregateUtilizationPercentage: initialFinancials.utilizationPercentage
};

export const DEMO_WELFARE_PROJECTS: WelfareProject[] = [
  {
    id: 'prj-01',
    code: 'DL-ND-2026-084',
    name: 'Annapurna Rasoi Kendra - Paharganj',
    ngoId: 'ngo-01',
    ngoName: 'Sahyog Seva Samiti',
    ngoRegNo: 'DL/2019/0482-NGO',
    projectId: 'prj-scheme-01',
    projectCode: 'MSJE-DSAS-2026-08',
    schemeName: 'Deendayal Subsidized Urban Nutrition Initiative',
    district: 'Central Delhi',
    state: 'NCT of Delhi',
    coordinates: { lat: 28.6415, lng: 77.2144 },
    geofenceRadiusMeters: 75,
    beneficiaryCapacity: 500,
    todayVerifiedCount: 462,
    todayMealTransactions: 698,
    todayMealViolationsBlocked: 14,
    operationalRiskScore: 0.88,
    aiAnomalyScore: 0.88,
    riskLevel: 'High Priority Inspection',
    riskContributingFactors: [
      'Unusual +48% surge in reported meal claims between 13:00-14:00 vs historical baseline',
      'YOLOv8 visual headcount estimate (142) diverged from claimed token disbursements (228)',
      '14 third-meal visit attempts blocked at POS terminal'
    ],
    lastVerificationTime: 'Today, 12:45 PM',
    inspectionStatus: 'Action Required',
    assignedOfficer: 'Devendra Sharma (Insp. ID: GOV-DL-041)',
    sha256EvidenceHash: 'a3f8c2b9841f487e91d8e6a4b12c98031d274eef7b5a8421c9e8d41075b24d98',
    cctvStreamStatus: 'Active',
    sanctionedBudget: 5000000,
    releasedBudget: 3500000,
    spentBudget: 2750000
  },
  {
    id: 'prj-02',
    code: 'DL-SD-2026-041',
    name: 'Jan Poshan Aahar Kendra - Okhla Ph-II',
    ngoId: 'ngo-02',
    ngoName: 'Pragati Welfare Foundation',
    ngoRegNo: 'DL/2018/1192-NGO',
    projectId: 'prj-scheme-02',
    projectCode: 'MSJE-ACSP-2026-14',
    schemeName: 'Antyodaya Community Sustenance Program',
    district: 'South Delhi',
    state: 'NCT of Delhi',
    coordinates: { lat: 28.5284, lng: 77.2763 },
    geofenceRadiusMeters: 100,
    beneficiaryCapacity: 650,
    todayVerifiedCount: 510,
    todayMealTransactions: 742,
    todayMealViolationsBlocked: 6,
    operationalRiskScore: 0.64,
    aiAnomalyScore: 0.64,
    riskLevel: 'Moderate Watch',
    riskContributingFactors: [
      'Mandatory on-site physical inspection overdue by 74 hours',
      'Off-peak distribution variance detected in operational meal issuance logs'
    ],
    lastVerificationTime: 'Yesterday, 07:15 PM',
    inspectionStatus: 'Overdue',
    assignedOfficer: null,
    sha256EvidenceHash: 'e74b2190f84a1bc402834d9a5b3281ef569720cb58197a1d3f9472e38c01b63e',
    cctvStreamStatus: 'Intermittent',
    sanctionedBudget: 6000000,
    releasedBudget: 4200000,
    spentBudget: 3100000
  },
  {
    id: 'prj-03',
    code: 'DL-WD-2026-092',
    name: 'Vishwa Shanti Bhojanalaya - Tilak Nagar',
    ngoId: 'ngo-03',
    ngoName: 'Vishwa Shanti Mission Trust',
    ngoRegNo: 'DL/2017/0931-NGO',
    projectId: 'prj-scheme-03',
    projectCode: 'MSJE-UDFM-2026-21',
    schemeName: 'Urban Destitute Food Security Mission',
    district: 'West Delhi',
    state: 'NCT of Delhi',
    coordinates: { lat: 28.6366, lng: 77.0963 },
    geofenceRadiusMeters: 60,
    beneficiaryCapacity: 400,
    todayVerifiedCount: 388,
    todayMealTransactions: 540,
    todayMealViolationsBlocked: 19,
    operationalRiskScore: 0.91,
    aiAnomalyScore: 0.91,
    riskLevel: 'High Priority Inspection',
    riskContributingFactors: [
      'Cluster of 19 third-meal attempts rejected within 25 minutes',
      'Abrupt CCTV feed telemetry dropouts during peak serving lunch hours',
      'Transaction issuance interval unusually fast (<6 seconds per record)'
    ],
    lastVerificationTime: 'Today, 01:10 PM',
    inspectionStatus: 'Scheduled',
    assignedOfficer: 'Anjali Meena (Insp. ID: GOV-DL-088)',
    sha256EvidenceHash: '99f84b12c77d90e234a180fb72a81230e9d284a51cb09478f23a1059b8c24177',
    cctvStreamStatus: 'Offline',
    sanctionedBudget: 4000000,
    releasedBudget: 2800000,
    spentBudget: 2450000
  },
  {
    id: 'prj-04',
    code: 'DL-ED-2026-015',
    name: 'Matoshree Community Kitchen - Laxmi Nagar',
    ngoId: 'ngo-04',
    ngoName: 'Kalyan Bharti Trust',
    ngoRegNo: 'DL/2021/0745-NGO',
    projectId: 'prj-scheme-04',
    projectCode: 'MSJE-MNOS-2026-05',
    schemeName: 'Matoshree Nutrition Outreach Scheme',
    district: 'East Delhi',
    state: 'NCT of Delhi',
    coordinates: { lat: 28.6318, lng: 77.2776 },
    geofenceRadiusMeters: 80,
    beneficiaryCapacity: 450,
    todayVerifiedCount: 395,
    todayMealTransactions: 580,
    todayMealViolationsBlocked: 3,
    operationalRiskScore: 0.14,
    aiAnomalyScore: 0.14,
    riskLevel: 'Normal',
    riskContributingFactors: [
      'Meal logs strictly match Gaussian historical distribution',
      'YOLOv8 spot headcount within 2.8% variance tolerance',
      'Geofence verification verified by field inspector at 11:30 AM'
    ],
    lastVerificationTime: 'Today, 11:30 AM',
    inspectionStatus: 'Verified Today',
    assignedOfficer: 'Ramesh Verma (Insp. ID: GOV-DL-019)',
    sha256EvidenceHash: '4c2b9a718d09e3f458a2110c79b8a34df2890be5c13289a01f5478bca612e345',
    cctvStreamStatus: 'Active',
    sanctionedBudget: 4500000,
    releasedBudget: 3200000,
    spentBudget: 2200000
  },
  {
    id: 'prj-05',
    code: 'DL-NW-2026-063',
    name: 'Deendayal Antyodaya Kendra - Rohini Sec-3',
    ngoId: 'ngo-05',
    ngoName: 'Ekta Vikas Parishad',
    ngoRegNo: 'DL/2020/0319-NGO',
    projectId: 'prj-scheme-05',
    projectCode: 'MSJE-GPUA-2026-33',
    schemeName: 'Gramin & Peri-Urban Aahar Yojana',
    district: 'North West Delhi',
    state: 'NCT of Delhi',
    coordinates: { lat: 28.7041, lng: 77.1025 },
    geofenceRadiusMeters: 75,
    beneficiaryCapacity: 600,
    todayVerifiedCount: 540,
    todayMealTransactions: 810,
    todayMealViolationsBlocked: 8,
    operationalRiskScore: 0.22,
    aiAnomalyScore: 0.22,
    riskLevel: 'Normal',
    riskContributingFactors: [
      'Routine bi-weekly random inspection currently active on premises',
      'Proof-of-presence geofence check logged successfully'
    ],
    lastVerificationTime: 'Today, 01:25 PM',
    inspectionStatus: 'In Progress',
    assignedOfficer: 'Sunita Rao (Insp. ID: GOV-DL-073)',
    sha256EvidenceHash: '33a8c1998f430e7bb91834df10283c749021e85bb784a0912f74619cd8201a45',
    cctvStreamStatus: 'Active',
    sanctionedBudget: 5500000,
    releasedBudget: 3900000,
    spentBudget: 2800000
  },
  {
    id: 'prj-06',
    code: 'DL-SW-2026-037',
    name: 'Gramin Poshan Seva Kendra - Najafgarh',
    ngoId: 'ngo-06',
    ngoName: 'Gram Seva Sangathan',
    ngoRegNo: 'DL/2016/1844-NGO',
    projectId: 'prj-scheme-06',
    projectCode: 'MSJE-RBBS-2026-19',
    schemeName: 'Rural Border Belt Sustenance Drive',
    district: 'South West Delhi',
    state: 'NCT of Delhi',
    coordinates: { lat: 28.6092, lng: 76.9854 },
    geofenceRadiusMeters: 90,
    beneficiaryCapacity: 350,
    todayVerifiedCount: 310,
    todayMealTransactions: 440,
    todayMealViolationsBlocked: 5,
    operationalRiskScore: 0.58,
    aiAnomalyScore: 0.58,
    riskLevel: 'Moderate Watch',
    riskContributingFactors: [
      'GPS ping cluster observed slightly near geofence periphery (14m offset)',
      'Transaction pacing surge in final 20 minutes before closure'
    ],
    lastVerificationTime: 'Today, 10:15 AM',
    inspectionStatus: 'Scheduled',
    assignedOfficer: 'Virendra Yadav (Insp. ID: GOV-DL-055)',
    sha256EvidenceHash: '77e10823bf9a4c520847b2c918a4f0923cb4190875e41982a0b76e19034dcb12',
    cctvStreamStatus: 'Active',
    sanctionedBudget: 3500000,
    releasedBudget: 2400000,
    spentBudget: 1850000
  }
];

export const DEMO_AI_ANOMALIES: AIAnomalyItem[] = [
  {
    id: 'anom-101',
    projectId: 'prj-01',
    projectName: 'Annapurna Rasoi Kendra - Paharganj',
    ngoName: 'Sahyog Seva Samiti',
    district: 'Central Delhi',
    timestamp: '10 mins ago (12:45 PM)',
    anomalyType: 'Headcount vs Service Distribution Mismatch',
    severity: 'High',
    description:
      'Isolation Forest & Headcount cross-audit flagged 86 meal token transactions issued without corresponding visual presence on live CCTV frame capture window.',
    recommendedAction:
      'Dispatch immediate risk-weighted field officer inspection with GPS proof-of-presence.',
    modelSource: 'YOLOv8n Visual Audit + Isolation Forest Tabular Engine v1.2'
  },
  {
    id: 'anom-102',
    projectId: 'prj-03',
    projectName: 'Vishwa Shanti Bhojanalaya - Tilak Nagar',
    ngoName: 'Vishwa Shanti Mission Trust',
    district: 'West Delhi',
    timestamp: '22 mins ago (12:33 PM)',
    anomalyType: 'Repeated 3rd-Meal Delivery Violations',
    severity: 'High',
    description:
      '19 consecutive attempts were made to scan beneficiaries who had already received 2 meals today. All 19 attempts were automatically blocked by terminal rule enforcement.',
    recommendedAction:
      'Review terminal logs and conduct spot audit on beneficiary queue discipline.',
    modelSource: 'NIGRANI 360 Core Policy Engine (Max 2 Meals/Day Rule)'
  },
  {
    id: 'anom-103',
    projectId: 'prj-01',
    projectName: 'Annapurna Rasoi Kendra - Paharganj',
    ngoName: 'Sahyog Seva Samiti',
    district: 'Central Delhi',
    timestamp: '41 mins ago (12:14 PM)',
    anomalyType: 'Unusual Increase in Reported Beneficiaries',
    severity: 'High',
    description:
      '+48% volume acceleration detected in 60-minute window compared to 30-day moving average for identical Tuesday lunchtime slot.',
    recommendedAction:
      'Flag center for automated random inspection weighting; verify stock consumption against claimed meals.',
    modelSource: 'Isolation Forest Anomaly Classifier (Confidence: 89.2%)'
  },
  {
    id: 'anom-104',
    projectId: 'prj-02',
    projectName: 'Jan Poshan Aahar Kendra - Okhla Ph-II',
    ngoName: 'Pragati Welfare Foundation',
    district: 'South Delhi',
    timestamp: '1 hr ago (11:55 AM)',
    anomalyType: 'Physical Inspection Overdue (>72 hrs)',
    severity: 'Medium',
    description:
      'No government field officer has performed GPS-geofenced physical presence validation within the statutory 72-hour window.',
    recommendedAction:
      'Anti-collusive assignment algorithm has prioritized this center for automated random dispatch.',
    modelSource: 'Compliance & Audit Trail Engine'
  },
  {
    id: 'anom-105',
    projectId: 'prj-06',
    projectName: 'Gramin Poshan Seva Kendra - Najafgarh',
    ngoName: 'Gram Seva Sangathan',
    district: 'South West Delhi',
    timestamp: '2 hrs ago (10:50 AM)',
    anomalyType: 'Geofence Peripheral Reporting Pattern',
    severity: 'Medium',
    description:
      'Field officer check-in terminal recorded GPS drift 14m outside the registered 90m boundary during morning stock receipt check.',
    recommendedAction:
      'Verify whether verification took place at loading dock or re-calibrate geofence centroid.',
    modelSource: 'Geofence Integrity Sentinel'
  }
];

export interface DemoBeneficiary {
  id: string;
  fullName: string;
  identificationToken: string;
  category: string;
  registeredCenterId: string;
  projectId: string;
  ngoId: string;
  status: 'Active' | 'Suspended' | 'Deceased';
}

export const DEMO_BENEFICIARIES: DemoBeneficiary[] = [
  // cnt-01: Annapurna Rasoi Kendra - Paharganj
  {
    id: 'ben-0101',
    fullName: 'Ramesh Kumar (Demo)',
    identificationToken: 'DEMO-FP-0001',
    category: 'Daily Wage Worker',
    registeredCenterId: 'cnt-01',
    projectId: 'prj-scheme-01',
    ngoId: 'ngo-01',
    status: 'Active'
  },
  {
    id: 'ben-0102',
    fullName: 'Sunita Devi (Demo)',
    identificationToken: 'DEMO-FP-0002',
    category: 'Senior Citizen / Destitute',
    registeredCenterId: 'cnt-01',
    projectId: 'prj-scheme-01',
    ngoId: 'ngo-01',
    status: 'Active'
  },
  {
    id: 'ben-0103',
    fullName: 'Mohan Lal (Demo)',
    identificationToken: 'DEMO-FP-0003',
    category: 'Street Vendor',
    registeredCenterId: 'cnt-01',
    projectId: 'prj-scheme-01',
    ngoId: 'ngo-01',
    status: 'Active'
  },
  {
    id: 'ben-0104',
    fullName: 'Kamla Bai (Demo)',
    identificationToken: 'DEMO-FP-0004',
    category: 'Disability Support',
    registeredCenterId: 'cnt-01',
    projectId: 'prj-scheme-01',
    ngoId: 'ngo-01',
    status: 'Active'
  },

  // cnt-02: Jan Poshan Aahar Kendra - Okhla Ph-II
  {
    id: 'ben-0201',
    fullName: 'Anil Verma (Demo)',
    identificationToken: 'DEMO-FP-0005',
    category: 'Industrial Contract Worker',
    registeredCenterId: 'cnt-02',
    projectId: 'prj-scheme-02',
    ngoId: 'ngo-02',
    status: 'Active'
  },
  {
    id: 'ben-0202',
    fullName: 'Rekha Sharma (Demo)',
    identificationToken: 'DEMO-FP-0006',
    category: 'Domestic Helper',
    registeredCenterId: 'cnt-02',
    projectId: 'prj-scheme-02',
    ngoId: 'ngo-02',
    status: 'Active'
  },
  {
    id: 'ben-0203',
    fullName: 'Santosh Yadav (Demo)',
    identificationToken: 'DEMO-FP-0007',
    category: 'Loading Laborer',
    registeredCenterId: 'cnt-02',
    projectId: 'prj-scheme-02',
    ngoId: 'ngo-02',
    status: 'Active'
  },
  {
    id: 'ben-0204',
    fullName: 'Pooja Kumari (Demo)',
    identificationToken: 'DEMO-FP-0008',
    category: 'Destitute Support',
    registeredCenterId: 'cnt-02',
    projectId: 'prj-scheme-02',
    ngoId: 'ngo-02',
    status: 'Active'
  },

  // cnt-03: Vishwa Shanti Bhojanalaya - Tilak Nagar
  {
    id: 'ben-0301',
    fullName: 'Joginder Singh (Demo)',
    identificationToken: 'DEMO-FP-0009',
    category: 'Senior Citizen / Destitute',
    registeredCenterId: 'cnt-03',
    projectId: 'prj-scheme-03',
    ngoId: 'ngo-03',
    status: 'Active'
  },
  {
    id: 'ben-0302',
    fullName: 'Gurpreet Kaur (Demo)',
    identificationToken: 'DEMO-FP-0010',
    category: 'Disability Support',
    registeredCenterId: 'cnt-03',
    projectId: 'prj-scheme-03',
    ngoId: 'ngo-03',
    status: 'Active'
  },
  {
    id: 'ben-0303',
    fullName: 'Manoj Tiwari (Demo)',
    identificationToken: 'DEMO-FP-0011',
    category: 'Migrant Worker',
    registeredCenterId: 'cnt-03',
    projectId: 'prj-scheme-03',
    ngoId: 'ngo-03',
    status: 'Active'
  },
  {
    id: 'ben-0304',
    fullName: 'Asha Rani (Demo)',
    identificationToken: 'DEMO-FP-0012',
    category: 'Widow Pension Beneficiary',
    registeredCenterId: 'cnt-03',
    projectId: 'prj-scheme-03',
    ngoId: 'ngo-03',
    status: 'Active'
  },

  // cnt-04: Matoshree Community Kitchen - Laxmi Nagar
  {
    id: 'ben-0401',
    fullName: 'Dinesh Chand (Demo)',
    identificationToken: 'DEMO-FP-0013',
    category: 'Cycle Rickshaw Puller',
    registeredCenterId: 'cnt-04',
    projectId: 'prj-scheme-04',
    ngoId: 'ngo-04',
    status: 'Active'
  },
  {
    id: 'ben-0402',
    fullName: 'Geeta Rajput (Demo)',
    identificationToken: 'DEMO-FP-0014',
    category: 'Destitute Support',
    registeredCenterId: 'cnt-04',
    projectId: 'prj-scheme-04',
    ngoId: 'ngo-04',
    status: 'Active'
  },
  {
    id: 'ben-0403',
    fullName: 'Rajendra Prasad (Demo)',
    identificationToken: 'DEMO-FP-0015',
    category: 'Senior Citizen',
    registeredCenterId: 'cnt-04',
    projectId: 'prj-scheme-04',
    ngoId: 'ngo-04',
    status: 'Active'
  },
  {
    id: 'ben-0404',
    fullName: 'Shashi Devi (Demo)',
    identificationToken: 'DEMO-FP-0016',
    category: 'Domestic Worker',
    registeredCenterId: 'cnt-04',
    projectId: 'prj-scheme-04',
    ngoId: 'ngo-04',
    status: 'Active'
  },

  // cnt-05: Deendayal Antyodaya Kendra - Rohini Sec-3
  {
    id: 'ben-0501',
    fullName: 'Surender Pal (Demo)',
    identificationToken: 'DEMO-FP-0017',
    category: 'Construction Laborer',
    registeredCenterId: 'cnt-05',
    projectId: 'prj-scheme-05',
    ngoId: 'ngo-05',
    status: 'Active'
  },
  {
    id: 'ben-0502',
    fullName: 'Bimla Devi (Demo)',
    identificationToken: 'DEMO-FP-0018',
    category: 'Senior Citizen / Destitute',
    registeredCenterId: 'cnt-05',
    projectId: 'prj-scheme-05',
    ngoId: 'ngo-05',
    status: 'Active'
  },
  {
    id: 'ben-0503',
    fullName: 'Ashok Gupta (Demo)',
    identificationToken: 'DEMO-FP-0019',
    category: 'Daily Wage Worker',
    registeredCenterId: 'cnt-05',
    projectId: 'prj-scheme-05',
    ngoId: 'ngo-05',
    status: 'Active'
  },
  {
    id: 'ben-0504',
    fullName: 'Meena Joshi (Demo)',
    identificationToken: 'DEMO-FP-0020',
    category: 'Disability Support',
    registeredCenterId: 'cnt-05',
    projectId: 'prj-scheme-05',
    ngoId: 'ngo-05',
    status: 'Active'
  },

  // cnt-06: Gramin Poshan Seva Kendra - Najafgarh
  {
    id: 'ben-0601',
    fullName: 'Balwan Singh (Demo)',
    identificationToken: 'DEMO-FP-0021',
    category: 'Rural Agricultural Laborer',
    registeredCenterId: 'cnt-06',
    projectId: 'prj-scheme-06',
    ngoId: 'ngo-06',
    status: 'Active'
  },
  {
    id: 'ben-0602',
    fullName: 'Kanta Devi (Demo)',
    identificationToken: 'DEMO-FP-0022',
    category: 'Senior Citizen',
    registeredCenterId: 'cnt-06',
    projectId: 'prj-scheme-06',
    ngoId: 'ngo-06',
    status: 'Active'
  },
  {
    id: 'ben-0603',
    fullName: 'Devender Kumar (Demo)',
    identificationToken: 'DEMO-FP-0023',
    category: 'Rural Artisan / Potter',
    registeredCenterId: 'cnt-06',
    projectId: 'prj-scheme-06',
    ngoId: 'ngo-06',
    status: 'Active'
  },
  {
    id: 'ben-0604',
    fullName: 'Vidya Wati (Demo)',
    identificationToken: 'DEMO-FP-0024',
    category: 'Destitute Support',
    registeredCenterId: 'cnt-06',
    projectId: 'prj-scheme-06',
    ngoId: 'ngo-06',
    status: 'Active'
  }
];


