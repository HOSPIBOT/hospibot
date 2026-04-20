'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "rso-dashboard",
  "title": "RSO Dashboard",
  "subtitle": "Radiation Safety Officer \u00b7 TLD Badges \u00b7 AERB Dose Monitoring",
  "apiPath": "/diagnostic/rso-dashboard",
  "regulations": [
    {
      "body": "AERB",
      "citation": "AE(RP) Rules 2004",
      "requirement": "RSO must monitor occupational dose. Investigation level: >6 mSv/quarter. Annual limit: 20 mSv/yr avg over 5yr."
    }
  ],
  "columns": [
    {
      "key": "createdAt",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "rsoName",
      "label": "RSO Name"
    },
    {
      "key": "reportType",
      "label": "Type"
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
      "key": "rsoName",
      "label": "RSO Name",
      "type": "text"
    },
    {
      "key": "rsoCertLevel",
      "label": "RSO Cert Level",
      "type": "select",
      "options": [
        "Level-I",
        "Level-II",
        "Level-III"
      ]
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
