"use client";

import React from "react";
import { useState, useEffect } from "react";
import { GoogleMap, LoadScript, Autocomplete, Marker } from "@react-google-maps/api";
import { getAllPatients, createPatient, deletePatient } from "@/lib/queries";



const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const center = {
  lat: 33.4484, // Phoenix, Arizona (ASU area)
  lng: -112.0740,
};

const libraries: ("places")[] = ["places"];

interface Patient {
  id: string;
  name: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dob?: string;
  mrn?: string;
  insurance?: string;
  weight?: number;
  bloodPressure?: string;
  pulse?: number;
  temperature?: number;
  respirationRate?: number;
  pulseOximetry?: number;
  failureType?: string;
  notes?: string;
  special_care: string;
  type: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

export default function PatientsECMOs() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    address: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dob: '',
    mrn: '',
    insurance: '',
    weight: '',
    bloodPressure: '',
    pulse: '',
    temperature: '',
    respirationRate: '',
    pulseOximetry: '',
    failureType: '',
    notes: '',
    specialCare: '',
    type: ''
  });

  // Fetch patients on component mount
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const patientsData = await getAllPatients();
      setPatients(patientsData);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async () => {
    // Combine name fields
    const fullName = `${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim();

    if (!fullName || !formData.specialCare || !formData.type || !selectedLocation) {
      alert('Please fill in all required fields and select a location');
      return;
    }

    try {
      setSubmitting(true);

      // Log new fields for testing (not yet in database)
      console.log('New patient data:', {
        ...formData,
        name: fullName
      });

      await createPatient({
        name: fullName,
        special_care: formData.specialCare,
        type: formData.type,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng
      });

      // Reset form and close modal
      setFormData({
        firstName: '',
        middleName: '',
        lastName: '',
        dob: '',
        mrn: '',
        insurance: '',
        weight: '',
        bloodPressure: '',
        pulse: '',
        temperature: '',
        respirationRate: '',
        pulseOximetry: '',
        failureType: '',
        notes: '',
        specialCare: '',
        type: ''
      });
      setSelectedLocation(null);
      setIsModalOpen(false);

      // Refresh patients list
      await fetchPatients();
    } catch (error) {
      console.error('Error creating patient:', error);
      alert('Error creating patient. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDeletePatient = async (patientId: string, patientName: string) => {
    if (!confirm(`Are you sure you want to delete ${patientName}?`)) {
      return;
    }

    try {
      await deletePatient(patientId);
      // Refresh patients list
      await fetchPatients();
    } catch (error) {
      console.error('Error deleting patient:', error);
      alert('Error deleting patient. Please try again.');
    }
  };

  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
      libraries={libraries}
    >
      <div className="space-y-6">
        {/* Add Patient Button */}
        <div className="flex justify-end items-center">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 shadow-lg shadow-purple-900/50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Patient
          </button>
        </div>

        {/* Split Layout */}
        <div className="flex gap-6 h-[calc(100vh-12rem)]">
          {/* Left Side - Patient Table */}
          <div className="w-2/5 bg-[#1a1a1a] border border-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-xl font-semibold text-gray-100">Patient List</h3>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#0f0f0f] sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      DOB
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      MRN
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Care Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      ECMO Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Vitals
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-[#1a1a1a] divide-y divide-gray-800">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                        Loading patients...
                      </td>
                    </tr>
                  ) : patients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                        No patients found. Add your first patient using the button above.
                      </td>
                    </tr>
                  ) : (
                    patients.map((patient, index) => (
                      <tr
                        key={patient.id}
                        className={`hover:bg-gray-800/50 transition-colors ${
                          index % 2 === 0 ? 'bg-[#1a1a1a]' : 'bg-[#141414]'
                        }`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-100">{patient.name}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-400">{patient.dob || '-'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-400">{patient.mrn || '-'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-300">{patient.special_care}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {patient.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-gray-300 space-y-1">
                            {patient.pulse && <div>Pulse: {patient.pulse} bpm</div>}
                            {patient.bloodPressure && <div>BP: {patient.bloodPressure}</div>}
                            {patient.temperature && <div>Temp: {patient.temperature}°F</div>}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => handleDeletePatient(patient.id, patient.name)}
                            className="text-red-400 hover:text-red-500 transition-colors"
                            title="Delete patient"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Side - Google Maps */}
          <div className="w-3/5 bg-[#1a1a1a] border border-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-xl font-semibold text-gray-100">Patient Locations</h3>
            </div>

            <div className="flex-1">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={10}
                options={{
                  zoomControl: true,
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: true,
                }}
              >
                {patients.map((patient) => (
                  <Marker
                    key={patient.id}
                    position={{
                      lat: patient.latitude,
                      lng: patient.longitude
                    }}
                    title={patient.name}
                    label={{
                      text: patient.name,
                      color: '#7C3AED',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  />
                ))}
              </GoogleMap>
            </div>
          </div>
        </div>

        {/* Patient Intake Request Form Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-2xl max-w-4xl w-full p-8 relative">
              {/* Close button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Form Container */}
              <div className="bg-[#0f0f0f] border border-gray-800 rounded-lg p-6">
                {/* Header */}
                <h3 className="text-2xl font-semibold text-blue-400 text-center mb-8">
                  Patient Intake Request Form
                </h3>

                {/* Top Section - Patient Identification */}
                <div className="grid grid-cols-6 gap-4 mb-6">
                  {/* Name Fields */}
                  <div className="col-span-3">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="First Name"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-700 rounded text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Middle Name"
                          value={formData.middleName}
                          onChange={(e) => handleInputChange('middleName', e.target.value)}
                          className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-700 rounded text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Last Name"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-700 rounded text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <label className="block text-sm text-gray-400 mt-1">Name</label>
                  </div>

                  {/* DOB */}
                  <div className="col-span-1">
                    <input
                      type="text"
                      placeholder="mm/dd/year"
                      value={formData.dob}
                      onChange={(e) => handleInputChange('dob', e.target.value)}
                      className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-700 rounded text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                    <label className="block text-sm text-gray-400 mt-1">DOB</label>
                  </div>

                  {/* MRN */}
                  <div className="col-span-1">
                    <input
                      type="text"
                      placeholder="Medical Record #"
                      value={formData.mrn}
                      onChange={(e) => handleInputChange('mrn', e.target.value)}
                      className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-700 rounded text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                    <label className="block text-sm text-gray-400 mt-1">MRN</label>
                  </div>

                  {/* Insurance */}
                  <div className="col-span-1">
                    <input
                      type="text"
                      placeholder="Insurance Provider"
                      value={formData.insurance}
                      onChange={(e) => handleInputChange('insurance', e.target.value)}
                      className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-700 rounded text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                    <label className="block text-sm text-gray-400 mt-1">Insurance</label>
                  </div>
                </div>

                {/* Middle Section - Vitals */}
                <div className="grid grid-cols-2 gap-8 mb-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-400 w-32">Weight</label>
                      <input
                        type="text"
                        placeholder="lbs"
                        value={formData.weight}
                        onChange={(e) => handleInputChange('weight', e.target.value)}
                        className="flex-1 px-3 py-2 bg-[#2a2a2a] border border-gray-700 rounded text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-400 w-32">Blood Pressure</label>
                      <input
                        type="text"
                        placeholder="120/80"
                        value={formData.bloodPressure}
                        onChange={(e) => handleInputChange('bloodPressure', e.target.value)}
                        className="flex-1 px-3 py-2 bg-[#2a2a2a] border border-gray-700 rounded text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-400 w-32">Temperature (F)</label>
                      <input
                        type="text"
                        placeholder="98.6"
                        value={formData.temperature}
                        onChange={(e) => handleInputChange('temperature', e.target.value)}
                        className="flex-1 px-3 py-2 bg-[#2a2a2a] border border-gray-700 rounded text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-400 w-32">Failure type</label>
                      <input
                        type="text"
                        placeholder="Respiratory/Cardiac"
                        value={formData.failureType}
                        onChange={(e) => handleInputChange('failureType', e.target.value)}
                        className="flex-1 px-3 py-2 bg-[#2a2a2a] border border-gray-700 rounded text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-400 w-32">Pulse</label>
                      <input
                        type="text"
                        placeholder="bpm"
                        value={formData.pulse}
                        onChange={(e) => handleInputChange('pulse', e.target.value)}
                        className="flex-1 px-3 py-2 bg-[#2a2a2a] border border-gray-700 rounded text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-400 w-32">Respiration rate</label>
                      <input
                        type="text"
                        placeholder="respirations per minute"
                        value={formData.respirationRate}
                        onChange={(e) => handleInputChange('respirationRate', e.target.value)}
                        className="flex-1 px-3 py-2 bg-[#2a2a2a] border border-gray-700 rounded text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-400 w-32">Pulse oximetry</label>
                      <input
                        type="text"
                        placeholder="%"
                        value={formData.pulseOximetry}
                        onChange={(e) => handleInputChange('pulseOximetry', e.target.value)}
                        className="flex-1 px-3 py-2 bg-[#2a2a2a] border border-gray-700 rounded text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Existing Fields */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Special Care
                    </label>
                    <select
                      value={formData.specialCare}
                      onChange={(e) => handleInputChange('specialCare', e.target.value)}
                      className="w-full px-4 py-2 bg-[#2a2a2a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-100"
                    >
                      <option value="" className="bg-[#2a2a2a]">Select care type...</option>
                      <option value="ICU" className="bg-[#2a2a2a]">ICU</option>
                      <option value="CCU" className="bg-[#2a2a2a]">CCU</option>
                      <option value="General Ward" className="bg-[#2a2a2a]">General Ward</option>
                      <option value="Emergency" className="bg-[#2a2a2a]">Emergency</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      ECMO Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="w-full px-4 py-2 bg-[#2a2a2a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-100"
                    >
                      <option value="" className="bg-[#2a2a2a]">Select ECMO type...</option>
                      <option value="VA ECMO" className="bg-[#2a2a2a]">VA ECMO</option>
                      <option value="VV ECMO" className="bg-[#2a2a2a]">VV ECMO</option>
                    </select>
                  </div>
                </div>

                {/* Location */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Location
                  </label>
                  <Autocomplete
                    onLoad={(autocompleteInstance) => setAutocomplete(autocompleteInstance)}
                    onPlaceChanged={() => {
                      if (autocomplete) {
                        const place = autocomplete.getPlace();
                        if (place.geometry?.location) {
                          setSelectedLocation({
                            address: place.formatted_address || "",
                            lat: place.geometry.location.lat(),
                            lng: place.geometry.location.lng(),
                          });
                        }
                      }
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Search for an address..."
                      className="w-full px-4 py-2 bg-[#2a2a2a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-100 placeholder-gray-500 focus:outline-none"
                    />
                  </Autocomplete>
                  {selectedLocation && (
                    <p className="text-xs text-gray-400 mt-1">
                      Selected: {selectedLocation.address}
                    </p>
                  )}
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Notes
                  </label>
                  <textarea
                    placeholder="Additional notes about the patient..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 bg-[#2a2a2a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-gray-100 placeholder-gray-500 focus:outline-none"
                  />
                </div>

                {/* Action Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleFormSubmit}
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium shadow-lg shadow-blue-900/50"
                  >
                    {submitting ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </LoadScript>
  );
}
