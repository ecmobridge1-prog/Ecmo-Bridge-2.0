import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { npi } = body;

    // Validate input
    if (!npi) {
      return NextResponse.json(
        { success: false, error: 'NPI number is required' },
        { status: 400 }
      );
    }

    // Validate NPI format (should be 10 digits)
    if (!/^\d{10}$/.test(npi)) {
      return NextResponse.json(
        { success: false, error: 'NPI must be exactly 10 digits' },
        { status: 400 }
      );
    }

    // Call NPPES API
    const nppesUrl = `https://npiregistry.cms.hhs.gov/api/?number=${npi}&version=2.1`;
    
    const response = await fetch(nppesUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Error fetching data from NPPES API:', response.status, response.statusText);
      return NextResponse.json(
        { success: false, error: 'Failed to verify NPI with registry' },
        { status: 500 }
      );
    }

    const data = await response.json();

    // Check if NPI was found
    if (data.result_count > 0 && data.results && data.results.length > 0) {
      const provider = data.results[0];
      const basic = provider.basic;
      
      // Extract provider information
      const providerInfo = {
        firstName: basic.first_name || '',
        lastName: basic.last_name || '',
        organizationName: basic.organization_name || '',
        credential: basic.credential || '',
        providerType: basic.provider_type || '',
        soleProprietor: basic.sole_proprietor || '',
        gender: basic.gender || '',
        enumerationDate: basic.enumeration_date || '',
        lastUpdated: basic.last_updated || '',
        certificationDate: basic.certification_date || '',
        status: basic.status || '',
      };

      console.log(`✅ NPI Found: ${providerInfo.firstName} ${providerInfo.lastName}`);
      
      return NextResponse.json({
        success: true,
        provider: providerInfo,
        npi: npi
      });
    } else {
      console.log('❌ NPI not found');
      return NextResponse.json(
        { success: false, error: 'NPI not found in registry' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Error in NPI verification:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
