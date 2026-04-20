'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "barc-reporting",
  "title": "BARC / AERB Reporting",
  "subtitle": "Annual Returns \u00b7 Dose Monitoring \u00b7 Equipment QA \u00b7 eLORA",
  "apiPath": "/diagnostic/barc-reporting",
  "regulations": [
    {
      "body": "AERB",
      "citation": "SC-3 Rev.2, AE(RP) Rules 2004",
      "requirement": "Occupational dose: 20 mSv/yr avg 5yr. Personnel monitoring. Equipment QA every 2yr. eLORA portal."
    }
  ],
  "columns": [
    {
      "key": "createdAt",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "reportType",
      "label": "Type"
    },
    {
      "key": "aerbLicenseNo",
      "label": "License"
    },
    {
      "key": "status",
      "label": "Status",
      "fmt": "status"
    }
  ],
  "formFields": [
    {
      "key": "reportType",
      "label": "Report Type",
      "type": "select",
      "required": true,
      "options": [
        "annual-return",
        "excessive-exposure",
        "equipment-qa",
        "license-renewal",
        "rso-report"
      ]
    },
    {
      "key": "aerbLicenseNo",
      "label": "AERB License No",
      "type": "text"
    },
    {
      "key": "rsoName",
      "label": "RSO Name",
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
