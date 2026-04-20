'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "forensic-toxicology-lab",
  "title": "Forensic / Toxicology Lab",
  "subtitle": "Drug Testing \u00b7 Chain of Custody \u00b7 GC-MS \u00b7 MRO \u00b7 Court Reports",
  "apiPath": "/diagnostic/forensic-toxicology-lab",
  "regulations": [
    {
      "body": "NDPS Act",
      "citation": "SAMHSA/WADA Standards, MRO Guidelines",
      "requirement": "Chain-of-custody documentation (court-admissible). MRO review for positive results. SAMHSA/WADA cut-off standards."
    }
  ],
  "columns": [
    {
      "key": "collectionDate",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "subjectName",
      "label": "Subject"
    },
    {
      "key": "caseType",
      "label": "Type"
    },
    {
      "key": "screenResult",
      "label": "Screen"
    },
    {
      "key": "status",
      "label": "Status",
      "fmt": "status"
    }
  ],
  "formFields": [
    {
      "key": "subjectName",
      "label": "Subject Name",
      "type": "text",
      "required": true
    },
    {
      "key": "caseType",
      "label": "Case Type",
      "type": "select",
      "required": true,
      "options": [
        "pre-employment",
        "random-workplace",
        "post-accident",
        "court-ordered",
        "sports-anti-doping",
        "therapeutic-drug-monitoring"
      ]
    },
    {
      "key": "chainOfCustodyId",
      "label": "CoC ID",
      "type": "text"
    },
    {
      "key": "sealIntact",
      "label": "Seal Intact",
      "type": "checkbox"
    },
    {
      "key": "mroReviewed",
      "label": "MRO Reviewed",
      "type": "checkbox"
    },
    {
      "key": "courtAdmissible",
      "label": "Court Admissible",
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
