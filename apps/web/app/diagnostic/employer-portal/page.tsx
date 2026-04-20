'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "employer-portal",
  "title": "Employer Portal",
  "subtitle": "Labour Code \u00b7 DPDPA Anonymization \u00b7 Forms 32/33",
  "apiPath": "/diagnostic/employer-portal",
  "regulations": [
    {
      "body": "MoLE / MeitY",
      "citation": "Labour Code 2020 + DPDPA 2023",
      "requirement": "Mandatory 40+ screening. Anonymized aggregate reporting. No individual PII to employer."
    }
  ],
  "columns": [
    {
      "key": "createdAt",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "employerName",
      "label": "Employer"
    },
    {
      "key": "utilizationPct",
      "label": "Utilization %"
    },
    {
      "key": "status",
      "label": "Status",
      "fmt": "status"
    }
  ],
  "formFields": [
    {
      "key": "employerName",
      "label": "Employer Name",
      "type": "text",
      "required": true
    },
    {
      "key": "industryType",
      "label": "Industry",
      "type": "text"
    },
    {
      "key": "totalEmployees",
      "label": "Total Employees",
      "type": "number"
    },
    {
      "key": "employeesAbove40",
      "label": "Employees 40+",
      "type": "number"
    },
    {
      "key": "packageName",
      "label": "Package",
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
