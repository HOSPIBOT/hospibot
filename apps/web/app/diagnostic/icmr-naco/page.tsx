'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "icmr-naco",
  "title": "ICMR / NACO Reports",
  "subtitle": "HIV Testing \u00b7 Positivity Rate \u00b7 EQAS \u00b7 SACS Reporting",
  "apiPath": "/diagnostic/icmr-naco",
  "regulations": [
    {
      "body": "NACO",
      "citation": "NACP Phase IV/V ICTC Guidelines",
      "requirement": "HIV testing counts, auto positivity rate. Gender-disaggregated. EQAS panel tracking. SACS hierarchy."
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
      "key": "reportingPeriod",
      "label": "Period"
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
        "sentinel-surveillance",
        "viral-load",
        "pptct",
        "eqas",
        "amr"
      ]
    },
    {
      "key": "reportingPeriod",
      "label": "Reporting Period",
      "type": "text",
      "required": true
    },
    {
      "key": "totalTested",
      "label": "Total Tested",
      "type": "number"
    },
    {
      "key": "totalPositive",
      "label": "Total Positive",
      "type": "number"
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
