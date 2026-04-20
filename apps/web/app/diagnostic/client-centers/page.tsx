'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "client-centers",
  "title": "Client Centers",
  "subtitle": "Referral Center Management \u00b7 Rate Cards \u00b7 SLA Config",
  "apiPath": "/diagnostic/client-centers",
  "regulations": [
    {
      "body": "NABL",
      "citation": "112A \u00a76.8",
      "requirement": "Referral centers must be documented. Modality-wise rate cards. Per-client SLA configuration. PACS/DICOM integration."
    }
  ],
  "columns": [
    {
      "key": "createdAt",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "centerName",
      "label": "Center"
    },
    {
      "key": "city",
      "label": "City"
    },
    {
      "key": "status",
      "label": "Status",
      "fmt": "status"
    }
  ],
  "formFields": [
    {
      "key": "centerName",
      "label": "Center Name",
      "type": "text",
      "required": true
    },
    {
      "key": "city",
      "label": "City",
      "type": "text"
    },
    {
      "key": "contactPerson",
      "label": "Contact Person",
      "type": "text"
    },
    {
      "key": "phone",
      "label": "Phone",
      "type": "text"
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
