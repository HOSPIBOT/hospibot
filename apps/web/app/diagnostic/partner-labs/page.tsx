'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "partner-labs",
  "title": "Partner Labs",
  "subtitle": "Referral Lab \u00b7 Rate Cards \u00b7 TAT SLA \u00b7 NABL Accreditation",
  "apiPath": "/diagnostic/partner-labs",
  "regulations": [
    {
      "body": "NABL",
      "citation": "112A \u00a76.8",
      "requirement": "Referral lab MUST be NABL-accredited. Rate card management. TAT SLA monitoring."
    }
  ],
  "columns": [
    {
      "key": "createdAt",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "labName",
      "label": "Lab"
    },
    {
      "key": "partnerType",
      "label": "Type"
    },
    {
      "key": "nablAccredited",
      "label": "NABL"
    },
    {
      "key": "status",
      "label": "Status",
      "fmt": "status"
    }
  ],
  "formFields": [
    {
      "key": "labName",
      "label": "Lab Name",
      "type": "text",
      "required": true
    },
    {
      "key": "partnerType",
      "label": "Type",
      "type": "select",
      "options": [
        "referral",
        "outsource",
        "reciprocal"
      ]
    },
    {
      "key": "nablAccredited",
      "label": "NABL Accredited",
      "type": "checkbox"
    },
    {
      "key": "contactPerson",
      "label": "Contact",
      "type": "text"
    },
    {
      "key": "routineTatHours",
      "label": "Routine TAT (hrs)",
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
