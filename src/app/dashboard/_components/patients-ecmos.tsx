"use client";

import React from "react";
import { useState, useEffect, useMemo } from "react";
import { GoogleMap, useJsApiLoader, Autocomplete, Marker, InfoWindow, OverlayView } from "@react-google-maps/api";
import { useUser } from "@clerk/nextjs";
import { 
  getAllPatients, 
  getPatientById,
  createPatient, 
  deletePatient,
  getQuestionnairesByPatient,
  getQuestionsWithResponses
} from "@/lib/queries";
import { clerkIdToUuid } from "@/lib/utils";
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
  const { user } = useUser();
  
  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: libraries,
  });

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

  // Questionnaire state
  const [patientQuestionnaires, setPatientQuestionnaires] = useState<any[]>([]);
  const [loadingQuestionnaires, setLoadingQuestionnaires] = useState(false);
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState<string | null>(null);
  const [questionnaireData, setQuestionnaireData] = useState<any>(null);
  const [loadingQuestionnaireData, setLoadingQuestionnaireData] = useState(false);
  // Hospital data and state
  const hospitals = [
    { name: "Chandler Regional Medical Center", address: "1955 W. Frye Rd, Chandler, 85224, AZ, United States" },
    { name: "Banner Children's at Desert", address: "1400 S Dobson Rd, Mesa, 85202, AZ, United States" },
    { name: "St. Joseph's Hospital and Medical Center", address: "500 West Thomas Rd, Suite 500, Phoenix, 85013, AZ, United States" },
    { name: "Phoenix Children's Hospital", address: "1919 E Thomas Rd, Phoenix, 85016, AZ, United States" },
    { name: "Banner University Medical Center (Phoenix)", address: "1111 East McDowell Rd, Phoenix, 85006, AZ, United States" },
    { name: "Mayo Clinic Hospital (Phoenix)", address: "5777 E. Mayo Blvd, Phoenix, 85054, AZ, United States" },
    { name: "Abrazo Arizona Heart Hospital", address: "1930 E. Thomas Rd, Phoenix, 85016, AZ, United States" },
    { name: "HonorHealth Scottsdale Shea Medical Center", address: "9003 E Shea Blvd, Scottsdale, 85260, AZ, United States" },
    { name: "Banner University Medical Center Tucson", address: "1501 N. Campbell Ave, #4607, Tucson, 85724, AZ, United States" }
  ];

  const [hospitalLocations, setHospitalLocations] = useState<Array<{
    name: string;
    address: string;
    lat: number;
    lng: number;
  }>>([]);
  const [selectedHospital, setSelectedHospital] = useState<number | null>(null);
  const [hoveredPatient, setHoveredPatient] = useState<string | null>(null);
  const [pinnedPatient, setPinnedPatient] = useState<string | null>(null);
  const [pinnedHospital, setPinnedHospital] = useState<number | null>(null);

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

  // Geocode hospital addresses on component mount
  useEffect(() => {
    const geocodeHospitals = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error('Google Maps API key not found');
        return;
      }

      const geocodedHospitals = await Promise.all(
        hospitals.map(async (hospital) => {
          try {
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
                hospital.address
              )}&key=${apiKey}`
            );
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
              const location = data.results[0].geometry.location;
              return {
                name: hospital.name,
                address: hospital.address,
                lat: location.lat,
                lng: location.lng,
              };
            }
            return null;
          } catch (error) {
            console.error(`Error geocoding ${hospital.name}:`, error);
            return null;
          }
        })
      );

      // Filter out any null results and update state
      setHospitalLocations(geocodedHospitals.filter((h) => h !== null) as Array<{
        name: string;
        address: string;
        lat: number;
        lng: number;
      }>);
    };

    geocodeHospitals();
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
        // Creator information
        created_by_user_id: user ? clerkIdToUuid(user.id) : undefined,
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

  // Questionnaire handlers
  const fetchPatientQuestionnaires = async (patientId: string) => {
    try {
      setLoadingQuestionnaires(true);
      const questionnaires = await getQuestionnairesByPatient(patientId);
      setPatientQuestionnaires(questionnaires || []);
    } catch (error) {
      console.error('Error fetching patient questionnaires:', error);
    } finally {
      setLoadingQuestionnaires(false);
    }
  };

  const handleOpenQuestionnaire = async (questionnaireId: string) => {
    try {
      setLoadingQuestionnaireData(true);
      setSelectedQuestionnaireId(questionnaireId);
      const questions = await getQuestionsWithResponses(questionnaireId);
      setQuestionnaireData(questions);
    } catch (error) {
      console.error('Error loading questionnaire:', error);
      alert('Failed to load questionnaire');
    } finally {
      setLoadingQuestionnaireData(false);
    }
  };

  // Effect to load questionnaires when patient detail modal opens
  useEffect(() => {
    if (isDetailModalOpen && selectedPatient) {
      fetchPatientQuestionnaires(selectedPatient.id);
    }
  }, [isDetailModalOpen, selectedPatient]);

  // Create icon configurations with google.maps.Point when API is loaded
  const patientMarkerIcon = useMemo(() => {
    if (!isLoaded || typeof google === 'undefined' || !google.maps?.Point) {
      return undefined;
    }
    return {
      path: "M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z",
      fillColor: '#3B82F6',
      fillOpacity: 1,
      strokeColor: '#2563EB',
      strokeWeight: 2,
      scale: 0.75,
      anchor: new google.maps.Point(0, 0),
    };
  }, [isLoaded]);

  const hospitalMarkerIcon = useMemo(() => {
    if (!isLoaded || typeof google === 'undefined' || !google.maps?.Point) {
      return undefined;
    }
    return {
      path: "M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z",
      fillColor: '#EA4335',
      fillOpacity: 0.95,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      scale: 1.0,
      anchor: new google.maps.Point(0, 0),
    };
  }, [isLoaded]);

  // Show loading state while API is loading
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-3"></div>
          <p className="text-gray-500">Loading map...</p>
        </div>
      </div>
    );
  }

  // Show error state if API failed to load
  if (loadError) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="text-center">
          <p className="text-red-500">Error loading Google Maps. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Notification Bell and Add Patient Button */}
        <div className="flex justify-end items-center gap-3 mt-4">
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
        <div className="flex gap-6 h-[calc(100vh-12rem)] mt-4">
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
          <div
            className="w-3/5 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden flex flex-col self-start"
            style={{ height: "calc(100vh - 12rem)" }}
          >
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
                {/* Patient Markers - Blue Pin Shape */}
                {patients.map((patient) => (
                  <Marker
                    key={patient.id}
                    position={{
                      lat: patient.latitude,
                      lng: patient.longitude
                    }}
                    icon={patientMarkerIcon}
                    onMouseOver={() => setHoveredPatient(patient.id)}
                    onMouseOut={() => setHoveredPatient(null)}
                    onClick={() => setPinnedPatient(patient.id)}
                  />
                ))}

                {/* Hospital Markers - Red Pins (Larger than Google's) */}
                {hospitalLocations.map((hospital, index) => (
                  <Marker
                    key={`hospital-${index}`}
                    position={{
                      lat: hospital.lat,
                      lng: hospital.lng
                    }}
                    title={hospital.name}
                    icon={hospitalMarkerIcon}
                    label={{
                      text: 'H',
                      color: '#FFFFFF',
                      fontSize: '16px',
                      fontWeight: 'bold',
                    }}
                    onMouseOver={() => setSelectedHospital(index)}
                    onMouseOut={() => setSelectedHospital(null)}
                    onClick={() => setPinnedHospital(index)}
                  />
                ))}

                {/* OverlayView for hovered or pinned patient */}
                {(() => {
                  const displayPatientId = pinnedPatient || hoveredPatient;
                  const displayPatient = displayPatientId ? patients.find(p => p.id === displayPatientId) : null;
                  const isPinned = pinnedPatient !== null;
                  
                  return displayPatient ? (
                    <OverlayView
                      position={{
                        lat: displayPatient.latitude,
                        lng: displayPatient.longitude
                      }}
                      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    >
                      <div className="relative" style={{ transform: 'translate(-50%, -100%)', marginTop: '-10px' }}>
                        <div className="bg-white rounded-lg shadow-lg px-3 py-2 relative min-w-[150px]">
                          {isPinned && (
                            <button
                              onClick={() => {
                                setPinnedPatient(null);
                                setHoveredPatient(null);
                              }}
                              className="absolute -top-2 -right-2 bg-white rounded-full w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 text-xl leading-none shadow-md border border-gray-200"
                            >
                              ×
                            </button>
                          )}
                          <p className="font-semibold text-gray-800 text-sm">
                            {displayPatient.name}
                          </p>
                        </div>
                        <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white" style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))' }}></div>
                      </div>
                    </OverlayView>
                  ) : null;
                })()}

                {/* OverlayView for hovered or pinned hospital */}
                {(() => {
                  const displayHospitalIndex = pinnedHospital !== null ? pinnedHospital : selectedHospital;
                  const displayHospital = displayHospitalIndex !== null ? hospitalLocations[displayHospitalIndex] : null;
                  const isPinned = pinnedHospital !== null;
                  
                  return displayHospital ? (
                    <OverlayView
                      position={{
                        lat: displayHospital.lat,
                        lng: displayHospital.lng
                      }}
                      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    >
                      <div className="relative" style={{ transform: 'translate(-50%, -100%)', marginTop: '-10px' }}>
                        <div className="bg-white rounded-lg shadow-lg px-3 py-2 relative min-w-[200px]">
                          {isPinned && (
                            <button
                              onClick={() => {
                                setPinnedHospital(null);
                                setSelectedHospital(null);
                              }}
                              className="absolute -top-2 -right-2 bg-white rounded-full w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 text-xl leading-none shadow-md border border-gray-200"
                            >
                              ×
                            </button>
                          )}
                          <h4 className="font-semibold text-gray-800 text-sm mb-1">
                            {displayHospital.name}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {displayHospital.address}
                          </p>
                        </div>
                        <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white" style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))' }}></div>
                      </div>
                    </OverlayView>
                  ) : null;
                })()}
              </GoogleMap>
            </div>
          </div>
        </div>

        {/* Patient Intake Request Form Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto pt-24">
            <div className="bg-white rounded-xl shadow-2xl w-[700px] max-h-[80vh] overflow-y-auto relative border-2 border-blue-300 my-8">
              {/* Close button - Absolute position */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 z-10 bg-red-500 hover:bg-red-600 rounded-full p-2 shadow-lg text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Form Container */}
              <div className="bg-gray-100 rounded-lg p-3">
                {/* Header */}
                <h3 className="text-lg font-semibold text-blue-800 text-center mb-3">
                  Patient Intake Request Form
                </h3>

                {/* Top Section - Patient Identification */}
                <div className="grid grid-cols-6 gap-2 mb-3">
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
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {/* Left Column */}
                  <div className="space-y-2">
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
                  <div className="space-y-2">
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
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Care
                    </label>
                    <select
                      value={formData.specialCare}
                      onChange={(e) => handleInputChange('specialCare', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                    >
                      <option value="">Select care type...</option>
                      <option value="ICU">ICU</option>
                      <option value="CCU">CCU</option>
                      <option value="General Ward">General Ward</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ECMO Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                    >
                      <option value="">Select ECMO type...</option>
                      <option value="VA ECMO">VA ECMO</option>
                      <option value="VV ECMO">VV ECMO</option>
                    </select>
                  </div>
                </div>

                {/* Location */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full px-3 py-2 bg-white border border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                    />
                  </Autocomplete>
                  {selectedLocation && (
                    <p className="text-xs text-gray-500 mt-1">
                      Selected: {selectedLocation.address}
                    </p>
                  )}
                </div>

                {/* Notes */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    placeholder="Additional notes about the patient..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-white border border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-black text-sm"
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

                {/* Questionnaires Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Patient Questionnaires
                    </h3>
                  </div>

                  {loadingQuestionnaires ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                  ) : patientQuestionnaires.length > 0 ? (
                    <div className="space-y-2">
                      {patientQuestionnaires.map((q) => (
                        <button
                          key={q.id}
                          onClick={() => handleOpenQuestionnaire(q.id)}
                          className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 hover:bg-blue-100 transition-colors text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-800">{q.title}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Created by {q.profiles?.full_name || q.profiles?.username || 'Unknown'} • {new Date(q.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
                      <svg className="mx-auto h-8 w-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm">No questionnaires found</p>
                      <p className="text-xs text-gray-400 mt-1">Questionnaires from chats regarding this patient will appear here</p>
                    </div>
                  )}
                </div>

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

        {/* View Questionnaire Modal */}
        {selectedQuestionnaireId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
              <button
                onClick={() => {
                  setSelectedQuestionnaireId(null);
                  setQuestionnaireData(null);
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 rounded-xl p-6 shadow-lg mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-bold text-gray-800">
                    {patientQuestionnaires.find(q => q.id === selectedQuestionnaireId)?.title || 'Questionnaire'}
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  Patient: <strong>{selectedPatient?.name}</strong>
                </p>
              </div>

              {loadingQuestionnaireData ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <>
                  {/* Read-only notice */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">Read-only view:</span> Questions and answers from all chats regarding this patient.
                      </p>
                    </div>
                  </div>

                  {/* Questions List */}
                  {questionnaireData && questionnaireData.length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-800">Questions:</h4>
                      {questionnaireData.map((q: any) => (
                        <div key={q.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                          <p className="font-medium text-gray-800 mb-2">{q.question_text}</p>

                          {q.responses && q.responses.length > 0 ? (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                              <p className="text-sm font-medium text-green-800 mb-2">Responses</p>
                              <div className="space-y-2">
                                {q.responses.map((r: any) => (
                                  <div key={r.id} className="text-gray-700">
                                    <p className="text-sm">{r.response_text}</p>
                                    {r.profiles && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        By {r.profiles.full_name || r.profiles.username || 'Unknown'}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2 text-sm text-gray-500 italic">
                              No responses yet
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                      <svg className="mx-auto h-10 w-10 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>No questions yet</p>
                      <p className="text-xs text-gray-400 mt-1">This questionnaire doesn't have any questions yet</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
  );
}
