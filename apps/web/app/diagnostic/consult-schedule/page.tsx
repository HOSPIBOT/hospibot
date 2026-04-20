'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "consult-schedule",
  "title": "Consult Schedule",
  "subtitle": "Post-Checkup \u00b7 Auto-Booking \u00b7 Abnormal Findings",
  "apiPath": "/diagnostic/consult-schedule",
  "regulations": [
    {
      "body": "Blueprint",
      "citation": "\u00a715 Health Checkup Workflow",
      "requirement": "Auto-booking on abnormal findings. Post-checkup doctor consultation. Referral tracking."
    }
  ],
  "columns": [
    {
      "key": "consultDate",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "patientName",
      "label": "Patient"
    },
    {
      "key": "doctorName",
      "label": "Doctor"
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
      "key": "consultType",
      "label": "Type",
      "type": "select",
      "options": [
        "post-checkup",
        "follow-up",
        "referral",
        "abnormal-result"
      ]
    },
    {
      "key": "doctorName",
      "label": "Doctor",
      "type": "text"
    },
    {
      "key": "consultDate",
      "label": "Date",
      "type": "date"
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
