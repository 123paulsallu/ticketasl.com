import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

/**
 * Test suite for admin credentials assignment
 * This verifies:
 * 1. Admin users can be assigned the 'admin' role
 * 2. Admin role assignment works through user_roles table
 * 3. Admin credentials persist and are retrievable
 * 4. RLS policies allow admins to manage roles
 */

describe('Admin Credentials Assignment', () => {
  let testAdminUserId: string;
  let testAdminEmail: string;
  let testPassword: string;

  beforeAll(async () => {
    // Setup test data
    testAdminEmail = `admin-test-${Date.now()}@ticketa.com`;
    testPassword = 'TestPassword123!';
  });

  it('should create an admin user account', async () => {
    const { data, error } = await supabase.auth.signUp({
      email: testAdminEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test Admin User',
        },
      },
    });

    expect(error).toBeNull();
    expect(data?.user?.id).toBeDefined();
    testAdminUserId = data?.user?.id || '';
  });

  it('should assign admin role to the created user', async () => {
    // Use the secure admin function to assign role
    const { data, error } = await supabase.rpc('assign_admin_role', {
      _user_id: testAdminUserId,
    });

    expect(error).toBeNull();
    expect(data?.success).toBe(true);
  });

  it('should retrieve admin role for the user', async () => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', testAdminUserId)
      .eq('role', 'admin');

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.length).toBeGreaterThan(0);
    expect(data?.[0]?.role).toBe('admin');
  });

  it('should verify admin has no duplicate roles', async () => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', testAdminUserId);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    
    // User should only have admin role, no duplicates
    const roles = data?.map(r => r.role) || [];
    const adminCount = roles.filter(r => r === 'admin').length;
    expect(adminCount).toBe(1);
  });

  it('should allow admin user to sign in', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testAdminEmail,
      password: testPassword,
    });

    expect(error).toBeNull();
    expect(data?.session?.user?.id).toBe(testAdminUserId);
  });

  it('should verify admin can view and manage user roles', async () => {
    // After signing in, verify the user can query user_roles
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', testAdminUserId);

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  afterAll(async () => {
    // Cleanup: delete test user
    if (testAdminUserId) {
      // Sign in as the test admin first
      await supabase.auth.signInWithPassword({
        email: testAdminEmail,
        password: testPassword,
      });

      // Delete user roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', testAdminUserId);

      // Delete profile
      await supabase
        .from('profiles')
        .delete()
        .eq('user_id', testAdminUserId);

      // Sign out
      await supabase.auth.signOut();
    }
  });
});

/**
 * Integration test for company admin credentials
 */
describe('Company Admin Credentials Assignment', () => {
  let testCompanyAdminUserId: string;
  let testCompanyId: string;
  let testAdminEmail: string;
  let testPassword: string;

  beforeAll(async () => {
    testAdminEmail = `company-admin-test-${Date.now()}@ticketa.com`;
    testPassword = 'TestPassword123!';
  });

  it('should create a company admin user', async () => {
    const { data, error } = await supabase.auth.signUp({
      email: testAdminEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test Company Admin',
        },
      },
    });

    expect(error).toBeNull();
    expect(data?.user?.id).toBeDefined();
    testCompanyAdminUserId = data?.user?.id || '';
  });

  it('should assign company_admin role', async () => {
    const { data, error } = await supabase.rpc('assign_company_admin_role', {
      _user_id: testCompanyAdminUserId,
    });

    expect(error).toBeNull();
    expect(data?.success).toBe(true);
  });

  it('should create a test company', async () => {
    const { data, error } = await supabase.rpc('create_company', {
      _name: `Test Company ${Date.now()}`,
      _description: 'Test company for admin credentials',
      _contact_email: `test-company-${Date.now()}@ticketa.com`,
    });

    expect(error).toBeNull();
    expect(data?.success).toBe(true);
    expect(data?.company_id).toBeDefined();
    testCompanyId = data?.company_id || '';
  });

  it('should assign company admin to company', async () => {
    const { data, error } = await supabase.rpc('assign_company_admin', {
      _user_id: testCompanyAdminUserId,
      _company_id: testCompanyId,
    });

    expect(error).toBeNull();
    expect(data?.success).toBe(true);
  });

  it('should retrieve company admin assignment', async () => {
    const { data, error } = await supabase
      .from('company_admins')
      .select('*')
      .eq('user_id', testCompanyAdminUserId);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.[0]?.company_id).toBe(testCompanyId);
  });

  afterAll(async () => {
    // Cleanup
    if (testCompanyAdminUserId) {
      await supabase
        .from('company_admins')
        .delete()
        .eq('user_id', testCompanyAdminUserId);

      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', testCompanyAdminUserId);

      await supabase
        .from('profiles')
        .delete()
        .eq('user_id', testCompanyAdminUserId);
    }

    if (testCompanyId) {
      await supabase
        .from('bus_companies')
        .delete()
        .eq('id', testCompanyId);
    }
  });
});
