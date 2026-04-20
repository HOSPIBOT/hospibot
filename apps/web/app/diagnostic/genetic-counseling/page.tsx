'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "genetic-counseling",
  "title": "Genetic Counseling",
  "subtitle": "Pre/Post-Test \u00b7 Doctor-Ordered \u00b7 VUS Disclosure",
  "apiPath": "/diagnostic/genetic-counseling",
  "regulations": [
    {
      "body": "ACMG/NSGC",
      "citation": "Genetic Counseling Standards",
      "requirement": "Doctor-ordered only. Pre/post-test sessions. VUS disclosure protocol. Informed consent mandatory."
    }
  ],
  "columns": [
    {
      "key": "sessionDate",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "patientName",
      "label": "Patient"
    },
    {
      "key": "sessionType",
      "label": "Session"
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
      "key": "sessionType",
      "label": "Session Type",
      "type": "select",
      "required": true,
      "options": [
        "pre-test",
        "post-test",
        "follow-up",
        "carrier-screening",
        "prenatal",
        "cancer-risk"
      ]
    },
    {
      "key": "orderingPhysician",
      "label": "Ordering Physician",
      "type": "text",
      "required": true
    },
    {
      "key": "counselorName",
      "label": "Counselor",
      "type": "text"
    },
    {
      "key": "informedConsentSigned",
      "label": "Consent Signed",
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
