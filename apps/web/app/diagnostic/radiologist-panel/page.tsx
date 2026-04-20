'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "radiologist-panel",
  "title": "Radiologist Panel",
  "subtitle": "Remote Reading \u00b7 MCI Reg \u00b7 TAT \u00b7 Digital Signature",
  "apiPath": "/diagnostic/radiologist-panel",
  "regulations": [
    {
      "body": "NMC/Telemedicine",
      "citation": "Telemedicine Guidelines 2020",
      "requirement": "MCI/NMC registration mandatory. Remote reading with digital signature. TAT tracking."
    }
  ],
  "columns": [
    {
      "key": "createdAt",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "radiologistName",
      "label": "Radiologist"
    },
    {
      "key": "modality",
      "label": "Modality"
    },
    {
      "key": "status",
      "label": "Status",
      "fmt": "status"
    }
  ],
  "formFields": [
    {
      "key": "radiologistName",
      "label": "Radiologist Name",
      "type": "text",
      "required": true
    },
    {
      "key": "mciRegNo",
      "label": "MCI Reg No",
      "type": "text"
    },
    {
      "key": "specialization",
      "label": "Specialization",
      "type": "text"
    },
    {
      "key": "dailyCapacity",
      "label": "Daily Capacity",
      "type": "number"
    },
    {
      "key": "remoteReading",
      "label": "Remote Reading",
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
