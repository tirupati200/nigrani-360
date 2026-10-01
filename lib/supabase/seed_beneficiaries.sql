-- ==============================================================================
-- NIGRANI 360 - FICTIONAL BENEFICIARY SEED DATA (SIH DEMO)
-- SIH26095: Smart Real-Time Monitoring & Inspection of Government Welfare Projects
-- Module: Beneficiary Enrollment & Fingerprint POS Verification Foundation
-- ==============================================================================
-- Notice: All identities are strictly FICTIONAL and for demonstration purposes.
-- No real personal identities, biometric templates, or sensitive PII are included.
-- Tokens DEMO-FP-0001 to DEMO-FP-0024 simulate secure biometric matching tokens.
-- ==============================================================================

INSERT INTO public.beneficiaries (
  id,
  full_name,
  identification_token,
  category,
  registered_center_id,
  project_id,
  ngo_id,
  status,
  created_at,
  updated_at
) VALUES
-- ------------------------------------------------------------------------------
-- 1. Center: cnt-01 (Annapurna Rasoi Kendra - Paharganj, Central Delhi)
--    Project: prj-scheme-01 (Deendayal Subsidized Urban Nutrition Initiative)
--    NGO: ngo-01 (Sahyog Seva Samiti)
-- ------------------------------------------------------------------------------
(
  'ben-0101',
  'Ramesh Kumar (Demo)',
  'DEMO-FP-0001',
  'Daily Wage Worker',
  'cnt-01',
  'prj-scheme-01',
  'ngo-01',
  'Active',
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '30 days'
),
(
  'ben-0102',
  'Sunita Devi (Demo)',
  'DEMO-FP-0002',
  'Senior Citizen / Destitute',
  'cnt-01',
  'prj-scheme-01',
  'ngo-01',
  'Active',
  NOW() - INTERVAL '28 days',
  NOW() - INTERVAL '28 days'
),
(
  'ben-0103',
  'Mohan Lal (Demo)',
  'DEMO-FP-0003',
  'Street Vendor',
  'cnt-01',
  'prj-scheme-01',
  'ngo-01',
  'Active',
  NOW() - INTERVAL '25 days',
  NOW() - INTERVAL '25 days'
),
(
  'ben-0104',
  'Kamla Bai (Demo)',
  'DEMO-FP-0004',
  'Disability Support',
  'cnt-01',
  'prj-scheme-01',
  'ngo-01',
  'Active',
  NOW() - INTERVAL '20 days',
  NOW() - INTERVAL '20 days'
),

-- ------------------------------------------------------------------------------
-- 2. Center: cnt-02 (Jan Poshan Aahar Kendra - Okhla Ph-II, South Delhi)
--    Project: prj-scheme-02 (Antyodaya Community Sustenance Program)
--    NGO: ngo-02 (Pragati Welfare Foundation)
-- ------------------------------------------------------------------------------
(
  'ben-0201',
  'Anil Verma (Demo)',
  'DEMO-FP-0005',
  'Industrial Contract Worker',
  'cnt-02',
  'prj-scheme-02',
  'ngo-02',
  'Active',
  NOW() - INTERVAL '32 days',
  NOW() - INTERVAL '32 days'
),
(
  'ben-0202',
  'Rekha Sharma (Demo)',
  'DEMO-FP-0006',
  'Domestic Helper',
  'cnt-02',
  'prj-scheme-02',
  'ngo-02',
  'Active',
  NOW() - INTERVAL '29 days',
  NOW() - INTERVAL '29 days'
),
(
  'ben-0203',
  'Santosh Yadav (Demo)',
  'DEMO-FP-0007',
  'Loading Laborer',
  'cnt-02',
  'prj-scheme-02',
  'ngo-02',
  'Active',
  NOW() - INTERVAL '22 days',
  NOW() - INTERVAL '22 days'
),
(
  'ben-0204',
  'Pooja Kumari (Demo)',
  'DEMO-FP-0008',
  'Destitute Support',
  'cnt-02',
  'prj-scheme-02',
  'ngo-02',
  'Active',
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '15 days'
),

-- ------------------------------------------------------------------------------
-- 3. Center: cnt-03 (Vishwa Shanti Bhojanalaya - Tilak Nagar, West Delhi)
--    Project: prj-scheme-03 (Urban Destitute Food Security Mission)
--    NGO: ngo-03 (Vishwa Shanti Mission Trust)
-- ------------------------------------------------------------------------------
(
  'ben-0301',
  'Joginder Singh (Demo)',
  'DEMO-FP-0009',
  'Senior Citizen / Destitute',
  'cnt-03',
  'prj-scheme-03',
  'ngo-03',
  'Active',
  NOW() - INTERVAL '35 days',
  NOW() - INTERVAL '35 days'
),
(
  'ben-0302',
  'Gurpreet Kaur (Demo)',
  'DEMO-FP-0010',
  'Disability Support',
  'cnt-03',
  'prj-scheme-03',
  'ngo-03',
  'Active',
  NOW() - INTERVAL '31 days',
  NOW() - INTERVAL '31 days'
),
(
  'ben-0303',
  'Manoj Tiwari (Demo)',
  'DEMO-FP-0011',
  'Migrant Worker',
  'cnt-03',
  'prj-scheme-03',
  'ngo-03',
  'Active',
  NOW() - INTERVAL '18 days',
  NOW() - INTERVAL '18 days'
),
(
  'ben-0304',
  'Asha Rani (Demo)',
  'DEMO-FP-0012',
  'Widow Pension Beneficiary',
  'cnt-03',
  'prj-scheme-03',
  'ngo-03',
  'Active',
  NOW() - INTERVAL '12 days',
  NOW() - INTERVAL '12 days'
),

-- ------------------------------------------------------------------------------
-- 4. Center: cnt-04 (Matoshree Community Kitchen - Laxmi Nagar, East Delhi)
--    Project: prj-scheme-04 (Matoshree Nutrition Outreach Scheme)
--    NGO: ngo-04 (Kalyan Bharti Trust)
-- ------------------------------------------------------------------------------
(
  'ben-0401',
  'Dinesh Chand (Demo)',
  'DEMO-FP-0013',
  'Cycle Rickshaw Puller',
  'cnt-04',
  'prj-scheme-04',
  'ngo-04',
  'Active',
  NOW() - INTERVAL '40 days',
  NOW() - INTERVAL '40 days'
),
(
  'ben-0402',
  'Geeta Rajput (Demo)',
  'DEMO-FP-0014',
  'Destitute Support',
  'cnt-04',
  'prj-scheme-04',
  'ngo-04',
  'Active',
  NOW() - INTERVAL '34 days',
  NOW() - INTERVAL '34 days'
),
(
  'ben-0403',
  'Rajendra Prasad (Demo)',
  'DEMO-FP-0015',
  'Senior Citizen',
  'cnt-04',
  'prj-scheme-04',
  'ngo-04',
  'Active',
  NOW() - INTERVAL '21 days',
  NOW() - INTERVAL '21 days'
),
(
  'ben-0404',
  'Shashi Devi (Demo)',
  'DEMO-FP-0016',
  'Domestic Worker',
  'cnt-04',
  'prj-scheme-04',
  'ngo-04',
  'Active',
  NOW() - INTERVAL '14 days',
  NOW() - INTERVAL '14 days'
),

-- ------------------------------------------------------------------------------
-- 5. Center: cnt-05 (Deendayal Antyodaya Kendra - Rohini Sec-3, North West Delhi)
--    Project: prj-scheme-05 (Gramin & Peri-Urban Aahar Yojana)
--    NGO: ngo-05 (Ekta Vikas Parishad)
-- ------------------------------------------------------------------------------
(
  'ben-0501',
  'Surender Pal (Demo)',
  'DEMO-FP-0017',
  'Construction Laborer',
  'cnt-05',
  'prj-scheme-05',
  'ngo-05',
  'Active',
  NOW() - INTERVAL '26 days',
  NOW() - INTERVAL '26 days'
),
(
  'ben-0502',
  'Bimla Devi (Demo)',
  'DEMO-FP-0018',
  'Senior Citizen / Destitute',
  'cnt-05',
  'prj-scheme-05',
  'ngo-05',
  'Active',
  NOW() - INTERVAL '24 days',
  NOW() - INTERVAL '24 days'
),
(
  'ben-0503',
  'Ashok Gupta (Demo)',
  'DEMO-FP-0019',
  'Daily Wage Worker',
  'cnt-05',
  'prj-scheme-05',
  'ngo-05',
  'Active',
  NOW() - INTERVAL '19 days',
  NOW() - INTERVAL '19 days'
),
(
  'ben-0504',
  'Meena Joshi (Demo)',
  'DEMO-FP-0020',
  'Disability Support',
  'cnt-05',
  'prj-scheme-05',
  'ngo-05',
  'Active',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days'
),

-- ------------------------------------------------------------------------------
-- 6. Center: cnt-06 (Gramin Poshan Seva Kendra - Najafgarh, South West Delhi)
--    Project: prj-scheme-06 (Rural Border Belt Sustenance Drive)
--    NGO: ngo-06 (Gram Seva Sangathan)
-- ------------------------------------------------------------------------------
(
  'ben-0601',
  'Balwan Singh (Demo)',
  'DEMO-FP-0021',
  'Rural Agricultural Laborer',
  'cnt-06',
  'prj-scheme-06',
  'ngo-06',
  'Active',
  NOW() - INTERVAL '36 days',
  NOW() - INTERVAL '36 days'
),
(
  'ben-0602',
  'Kanta Devi (Demo)',
  'DEMO-FP-0022',
  'Senior Citizen',
  'cnt-06',
  'prj-scheme-06',
  'ngo-06',
  'Active',
  NOW() - INTERVAL '27 days',
  NOW() - INTERVAL '27 days'
),
(
  'ben-0603',
  'Devender Kumar (Demo)',
  'DEMO-FP-0023',
  'Rural Artisan / Potter',
  'cnt-06',
  'prj-scheme-06',
  'ngo-06',
  'Active',
  NOW() - INTERVAL '16 days',
  NOW() - INTERVAL '16 days'
),
(
  'ben-0604',
  'Vidya Wati (Demo)',
  'DEMO-FP-0024',
  'Destitute Support',
  'cnt-06',
  'prj-scheme-06',
  'ngo-06',
  'Active',
  NOW() - INTERVAL '8 days',
  NOW() - INTERVAL '8 days'
)
ON CONFLICT (id) DO NOTHING;
