-- Update RK Enterprises company details

UPDATE company_settings
SET 
  company_name = 'RK ENTERPRISES',
  address = 'No.23/2,Part,GreenAcres,2ndLayout,Mathur',
  city = 'Sriperumbudur',
  state = 'Tamil Nadu',
  pincode = '602105',
  phone = '+91 7904982523',
  email = 'rk.enterprises.tn.2025@gmail.com',
  gst_no = '33BLQPP6954N1Z7',
  updated_at = NOW()
WHERE id = (SELECT id FROM company_settings LIMIT 1);

-- If no company settings exist, insert them
INSERT INTO company_settings (
  company_name,
  address,
  city,
  state,
  pincode,
  phone,
  email,
  gst_no
)
SELECT 
  'RK ENTERPRISES',
  'No.23/2,Part,GreenAcres,2ndLayout,Mathur',
  'Sriperumbudur',
  'Tamil Nadu',
  '602105',
  '+91 7904982523',
  'rk.enterprises.tn.2025@gmail.com',
  '33BLQPP6954N1Z7'
WHERE NOT EXISTS (SELECT 1 FROM company_settings LIMIT 1);
