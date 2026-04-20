'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "dghs-reporting",
  "title": "DGHS Reporting",
  "subtitle": "IDSP Forms S/P/L \u00b7 IHIP \u00b7 33+ Diseases \u00b7 AMR Surveillance",
  "apiPath": "/diagnostic/dghs-reporting",
  "regulations": [
    {
      "body": "DGHS/NCDC",
      "citation": "IDSP/IHIP Reporting Guidelines",
      "requirement": "Forms S (suspected), P (presumptive), L (lab confirmed). Weekly Mon-Sun. 33+ disease conditions."
    }
  ],
  "columns": [
    {
      "key": "reportingWeekEnd",
      "label": "Week End",
      "fmt": "date"
    },
    {
      "key": "reportForm",
      "label": "Form"
    },
    {
      "key": "diseaseName",
      "label": "Disease"
    },
    {
      "key": "casesReported",
      "label": "Cases"
    },
    {
      "key": "status",
      "label": "Status",
      "fmt": "status"
    }
  ],
  "formFields": [
    {
      "key": "reportForm",
      "label": "Form Type",
      "type": "select",
      "required": true,
      "options": [
        "S",
        "P",
        "L"
      ]
    },
    {
      "key": "diseaseName",
      "label": "Disease",
      "type": "text",
      "required": true
    },
    {
      "key": "reportingWeekStart",
      "label": "Week Start",
      "type": "date"
    },
    {
      "key": "reportingWeekEnd",
      "label": "Week End",
      "type": "date"
    },
    {
      "key": "casesReported",
      "label": "Cases",
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
