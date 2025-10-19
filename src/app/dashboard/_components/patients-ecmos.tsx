"use client";

import React from "react";
import { useState, useEffect } from "react";
import { GoogleMap, LoadScript, Autocomplete, Marker } from "@react-google-maps/api";
import { getAllPatients, createPatient, deletePatient } from "@/lib/queries";
import NotificationBell from "./notification-bell";

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
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  dob?: string;
  mrn?: string;
  insurance?: string;
  weight?: number;
  blood_pressure?: string;
  pulse?: number;
  temperature?: number;
  respiration_rate?: number;
  pulse_oximetry?: number;
  failure_type?: string;
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
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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
        longitude: selectedLocation.lng,
        // Add all new fields
        first_name: formData.firstName || undefined,
        middle_name: formData.middleName || undefined,
        last_name: formData.lastName || undefined,
        dob: formData.dob || undefined,
        mrn: formData.mrn || undefined,
        insurance: formData.insurance || undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        blood_pressure: formData.bloodPressure || undefined,
        pulse: formData.pulse ? parseInt(formData.pulse) : undefined,
        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
        respiration_rate: formData.respirationRate ? parseInt(formData.respirationRate) : undefined,
        pulse_oximetry: formData.pulseOximetry ? parseFloat(formData.pulseOximetry) : undefined,
        failure_type: formData.failureType || undefined,
        notes: formData.notes || undefined,
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
        {/* Notification Bell and Add Patient Button */}
        <div className="flex justify-end items-center gap-3">
          <NotificationBell />
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
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
          <div className="w-2/5 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">Patient List</h3>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-3"></div>
                    <p className="text-gray-500">Loading patients...</p>
                  </div>
                </div>
              ) : patients.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="text-gray-500 text-lg">No patients found</p>
                  <p className="text-gray-400 text-sm mt-1">Add your first patient using the button above</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {patients.map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => {
                        setSelectedPatient(patient);
                        setIsDetailModalOpen(true);
                      }}
                      className="relative bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group"
                    >
                      {/* Delete button - top right */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePatient(patient.id, patient.name);
                        }}
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-red-100"
                        title="Delete patient"
                      >
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>

                      {/* Patient info */}
                      <div className="pr-8">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{patient.name}</h4>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            {patient.type}
                          </span>
                          <span className="text-sm text-gray-600">
                            {patient.special_care}
                          </span>
                          {patient.dob && (
                            <span className="text-sm text-gray-500">
                              DOB: {patient.dob}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Google Maps */}
          <div className="w-3/5 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">Patient Locations</h3>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto relative border-2 border-blue-300 my-8">
              {/* Close button - Fixed position */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="fixed top-6 right-6 z-10 bg-white rounded-full p-2 shadow-lg text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Form Container */}
              <div className="bg-gray-100 rounded-lg p-6">
                {/* Header */}
                <h3 className="text-2xl font-semibold text-blue-800 text-center mb-8">
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
                          className="w-full px-3 py-2 bg-white border border-blue-400 rounded text-sm text-black"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Middle Name"
                          value={formData.middleName}
                          onChange={(e) => handleInputChange('middleName', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-blue-400 rounded text-sm text-black"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Last Name"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-blue-400 rounded text-sm text-black"
                        />
                      </div>
                    </div>
                    <label className="block text-sm text-gray-700 mt-1">Name</label>
                  </div>

                  {/* DOB */}
                  <div className="col-span-1">
                    <input
                      type="text"
                      placeholder="mm/dd/year"
                      value={formData.dob}
                      onChange={(e) => handleInputChange('dob', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-blue-400 rounded text-sm text-black"
                    />
                    <label className="block text-sm text-gray-700 mt-1">DOB</label>
                  </div>

                  {/* MRN */}
                  <div className="col-span-1">
                    <input
                      type="text"
                      placeholder="Medical Record #"
                      value={formData.mrn}
                      onChange={(e) => handleInputChange('mrn', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-blue-400 rounded text-sm text-black"
                    />
                    <label className="block text-sm text-gray-700 mt-1">MRN</label>
                  </div>

                  {/* Insurance */}
                  <div className="col-span-1">
                    <input
                      type="text"
                      placeholder="Insurance Provider"
                      value={formData.insurance}
                      onChange={(e) => handleInputChange('insurance', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-blue-400 rounded text-sm text-black"
                    />
                    <label className="block text-sm text-gray-700 mt-1">Insurance</label>
                  </div>
                </div>

                {/* Middle Section - Vitals */}
                <div className="grid grid-cols-2 gap-8 mb-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-700 w-20">Weight</label>
                      <input
                        type="text"
                        placeholder="lbs"
                        value={formData.weight}
                        onChange={(e) => handleInputChange('weight', e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-blue-400 rounded text-sm text-black"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-700 w-20">Blood Pressure</label>
                      <input
                        type="text"
                        placeholder="120/80"
                        value={formData.bloodPressure}
                        onChange={(e) => handleInputChange('bloodPressure', e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-blue-400 rounded text-sm text-black"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-700 w-20">Temperature (F)</label>
                      <input
                        type="text"
                        placeholder="98.6"
                        value={formData.temperature}
                        onChange={(e) => handleInputChange('temperature', e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-blue-400 rounded text-sm text-black"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-700 w-20">Failure type</label>
                      <input
                        type="text"
                        placeholder="Respiratory/Cardiac"
                        value={formData.failureType}
                        onChange={(e) => handleInputChange('failureType', e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-blue-400 rounded text-sm text-black"
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-700 w-20">Pulse</label>
                      <input
                        type="text"
                        placeholder="bpm"
                        value={formData.pulse}
                        onChange={(e) => handleInputChange('pulse', e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-blue-400 rounded text-sm text-black"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-700 w-20">Respiration rate</label>
                      <input
                        type="text"
                        placeholder="respirations per minute"
                        value={formData.respirationRate}
                        onChange={(e) => handleInputChange('respirationRate', e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-blue-400 rounded text-sm text-black"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-700 w-20">Pulse oximetry</label>
                      <input
                        type="text"
                        placeholder="%"
                        value={formData.pulseOximetry}
                        onChange={(e) => handleInputChange('pulseOximetry', e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-blue-400 rounded text-sm text-black"
                      />
                    </div>
                  </div>
                </div>

                {/* Existing Fields */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Care
                    </label>
                    <select
                      value={formData.specialCare}
                      onChange={(e) => handleInputChange('specialCare', e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                    >
                      <option value="">Select care type...</option>
                      <option value="ICU">ICU</option>
                      <option value="CCU">CCU</option>
                      <option value="General Ward">General Ward</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ECMO Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                    >
                      <option value="">Select ECMO type...</option>
                      <option value="VA ECMO">VA ECMO</option>
                      <option value="VV ECMO">VV ECMO</option>
                    </select>
                  </div>
                </div>

                {/* Location */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="w-full px-4 py-2 bg-white border border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                    />
                  </Autocomplete>
                  {selectedLocation && (
                    <p className="text-xs text-gray-500 mt-1">
                      Selected: {selectedLocation.address}
                    </p>
                  )}
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    placeholder="Additional notes about the patient..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 bg-white border border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-black"
                  />
                </div>

                {/* Action Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleFormSubmit}
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium"
                  >
                    {submitting ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Patient Detail Modal */}
        {isDetailModalOpen && selectedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
              {/* Close button */}
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedPatient(null);
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 rounded-t-xl">
                <h2 className="text-2xl font-bold mb-2">{selectedPatient.name}</h2>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                    {selectedPatient.type}
                  </span>
                  <span className="text-purple-100">{selectedPatient.special_care}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Demographics */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Demographics
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Date of Birth</p>
                      <p className="text-sm font-medium text-gray-900">{selectedPatient.dob || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Medical Record Number</p>
                      <p className="text-sm font-medium text-gray-900">{selectedPatient.mrn || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Insurance</p>
                      <p className="text-sm font-medium text-gray-900">{selectedPatient.insurance || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Vitals */}
                {(selectedPatient.weight || selectedPatient.blood_pressure || selectedPatient.pulse || 
                  selectedPatient.temperature || selectedPatient.respiration_rate || selectedPatient.pulse_oximetry) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Vital Signs
                    </h3>
                    <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                      {selectedPatient.weight && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Weight</p>
                          <p className="text-sm font-medium text-gray-900">{selectedPatient.weight} lbs</p>
                        </div>
                      )}
                      {selectedPatient.blood_pressure && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Blood Pressure</p>
                          <p className="text-sm font-medium text-gray-900">{selectedPatient.blood_pressure}</p>
                        </div>
                      )}
                      {selectedPatient.pulse && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Pulse</p>
                          <p className="text-sm font-medium text-gray-900">{selectedPatient.pulse} bpm</p>
                        </div>
                      )}
                      {selectedPatient.temperature && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Temperature</p>
                          <p className="text-sm font-medium text-gray-900">{selectedPatient.temperature}°F</p>
                        </div>
                      )}
                      {selectedPatient.respiration_rate && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Respiration Rate</p>
                          <p className="text-sm font-medium text-gray-900">{selectedPatient.respiration_rate}/min</p>
                        </div>
                      )}
                      {selectedPatient.pulse_oximetry && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Pulse Oximetry</p>
                          <p className="text-sm font-medium text-gray-900">{selectedPatient.pulse_oximetry}%</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Medical Information */}
                {(selectedPatient.failure_type || selectedPatient.notes) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Medical Information
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      {selectedPatient.failure_type && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Failure Type</p>
                          <p className="text-sm font-medium text-gray-900">{selectedPatient.failure_type}</p>
                        </div>
                      )}
                      {selectedPatient.notes && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Notes</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedPatient.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      setSelectedPatient(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleDeletePatient(selectedPatient.id, selectedPatient.name);
                      setIsDetailModalOpen(false);
                      setSelectedPatient(null);
                    }}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Delete Patient
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