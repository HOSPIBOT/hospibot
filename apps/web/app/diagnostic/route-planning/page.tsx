'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "route-planning",
  "title": "Route Planning",
  "subtitle": "Collection Routes \u00b7 Stops \u00b7 Cold Chain \u00b7 Handover",
  "apiPath": "/diagnostic/route-planning",
  "regulations": [
    {
      "body": "Operations",
      "citation": "Sample Transport SOP",
      "requirement": "Route optimization. Cold chain maintenance. Sample handover tracking."
    }
  ],
  "columns": [
    {
      "key": "routeDate",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "routeName",
      "label": "Route"
    },
    {
      "key": "agentName",
      "label": "Agent"
    },
    {
      "key": "status",
      "label": "Status",
      "fmt": "status"
    }
  ],
  "formFields": [
    {
      "key": "routeName",
      "label": "Route Name",
      "type": "text",
      "required": true
    },
    {
      "key": "routeDate",
      "label": "Date",
      "type": "date",
      "required": true
    },
    {
      "key": "agentName",
      "label": "Agent",
      "type": "text"
    },
    {
      "key": "totalStops",
      "label": "Total Stops",
      "type": "number"
    },
    {
      "key": "estimatedKm",
      "label": "Est. KM",
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
