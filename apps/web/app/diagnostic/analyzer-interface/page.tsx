'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "analyzer-interface",
  "title": "Analyzer Interface (HL7/ASTM)",
  "subtitle": "Auto Result Capture · Sysmex · Cobas · Vitros · Mindray · Architect · Critical Value Alerts",
  "apiPath": "/analyzer-interface/messages",
  "regulations": [
    {"body": "NABL", "citation": "ISO 15189:2022 §6.4, §7.3", "requirement": "Analyzer-LIS interface mandatory for accreditation. Auto result capture reduces transcription errors. Equipment verification on installation. Bi-directional interface preferred."},
    {"body": "CLSI", "citation": "LIS01-A2 / LIS02-A2", "requirement": "HL7 v2.x for high-level messaging. ASTM E1381/E1394 for low-level protocol. Message acknowledgement (ACK) required. Critical value flagging."}
  ],
  "columns": [
    {"key": "createdAt", "label": "Received", "fmt": "date"},
    {"key": "sendingApplication", "label": "Analyzer"},
    {"key": "patientName", "label": "Patient"},
    {"key": "resultCount", "label": "Results"},
    {"key": "processedStatus", "label": "Status", "fmt": "status"}
  ],
  "formFields": [
    {"key": "name", "label": "Analyzer Name", "type": "text", "required": true},
    {"key": "manufacturer", "label": "Manufacturer", "type": "select", "options": ["Sysmex", "Roche", "Abbott", "Ortho/Vitros", "Mindray", "Beckman Coulter", "Siemens", "Bio-Rad", "Horiba", "Other"]},
    {"key": "model", "label": "Model", "type": "text", "placeholder": "e.g., XN-1000, Cobas c501"},
    {"key": "serialNumber", "label": "Serial Number", "type": "text"},
    {"key": "department", "label": "Department", "type": "select", "options": ["Hematology", "Biochemistry", "Immunoassay", "Coagulation", "Urinalysis", "Blood Gas"]},
    {"key": "protocol", "label": "Protocol", "type": "select", "options": ["hl7", "astm"]},
    {"key": "host", "label": "IP Address", "type": "text", "placeholder": "192.168.1.100"},
    {"key": "port", "label": "Port", "type": "number", "placeholder": "2575"},
    {"key": "notes", "label": "Notes", "type": "textarea", "span": 2}
  ],
  "createLabel": "Register Analyzer"
};

export default function Page() {
  return <FeatureCrudPage config={config} />;
}
