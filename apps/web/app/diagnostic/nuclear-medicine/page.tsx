'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "nuclear-medicine",
  "title": "Nuclear Medicine",
  "subtitle": "SPECT \u00b7 Thyroid I-131 \u00b7 Bone Scan \u00b7 MPI \u00b7 Dosimetry \u00b7 AERB",
  "apiPath": "/diagnostic/nuclear-medicine",
  "regulations": [
    {
      "body": "AERB",
      "citation": "AE(RP) Rules 2004, eLORA Portal",
      "requirement": "Multi-isotope tracking with half-life decay. Patient dosimetry. I-131 isolation management. AERB annual returns."
    }
  ],
  "columns": [
    {
      "key": "studyDate",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "patientName",
      "label": "Patient"
    },
    {
      "key": "studyType",
      "label": "Study"
    },
    {
      "key": "isotope",
      "label": "Isotope"
    },
    {
      "key": "status",
      "label": "Status",
      "fmt": "status"
    }
  ],
  "formFields": [
    {
      "key": "patientName",
      "label": "Patient Name",
      "type": "text",
      "required": true
    },
    {
      "key": "studyType",
      "label": "Study Type",
      "type": "select",
      "required": true,
      "options": [
        "thyroid-scan",
        "bone-scan",
        "renal-scan",
        "cardiac-mpi",
        "spect-brain",
        "i131-therapy",
        "lu177-therapy"
      ]
    },
    {
      "key": "isotope",
      "label": "Isotope",
      "type": "select",
      "options": [
        "Tc-99m",
        "I-131",
        "F-18",
        "Ga-68",
        "Lu-177"
      ]
    },
    {
      "key": "administeredActivityMbq",
      "label": "Activity (MBq)",
      "type": "number"
    },
    {
      "key": "isolationRequired",
      "label": "Isolation Required",
      "type": "checkbox"
    },
    {
      "key": "notes",
      "label": "Notes",
      "type": "textarea",
      "span": 2
    }
  ]
};

export default function Page() {{
  return <FeatureCrudPage config={{config}} />;
}}
