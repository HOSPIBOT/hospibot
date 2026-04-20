'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "population-health",
  "title": "Population Health",
  "subtitle": "Cohort Analytics \u00b7 NCD Prevalence \u00b7 Risk Stratification",
  "apiPath": "/diagnostic/population-health",
  "regulations": [
    {
      "body": "IDSP/ICMR",
      "citation": "NCD Screening Guidelines",
      "requirement": "Cohort-based analytics. NCD prevalence tracking. Risk stratification."
    }
  ],
  "columns": [
    {
      "key": "createdAt",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "cohortName",
      "label": "Cohort"
    },
    {
      "key": "cohortType",
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
      "key": "cohortName",
      "label": "Cohort Name",
      "type": "text",
      "required": true
    },
    {
      "key": "cohortType",
      "label": "Type",
      "type": "select",
      "options": [
        "age-group",
        "gender",
        "location",
        "disease",
        "employer",
        "custom"
      ]
    },
    {
      "key": "totalPatients",
      "label": "Total Patients",
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
