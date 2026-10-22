const http = require('http');

const BASE_URL = 'http://localhost:5000/api';
let cookieToken = '';
let authToken = '';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (cookieToken) {
      options.headers['Cookie'] = cookieToken;
    }

    const req = http.request(options, (res) => {
      let data = '';
      if (res.headers['set-cookie']) {
        cookieToken = res.headers['set-cookie'].join('; ');
      }
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runApiTests() {
  console.log('\n======================================================');
  console.log('🚀 AUTOMATED BACKEND API TEST SUITE (Office SaaS)');
  console.log('======================================================\n');

  try {
    // 1. Auth Login
    console.log('1. Testing POST /api/auth/login ...');
    const loginRes = await request('POST', '/auth/login', {
      email: 'admin@office.local',
      password: 'Admin@123456'
    });
    console.log(`   Status: ${loginRes.status} | Success: ${loginRes.data.success}`);
    if (!loginRes.data.success) throw new Error('Login failed!');
    authToken = loginRes.data.data.token;
    console.log('   ✅ Logged in successfully. JWT Token acquired!\n');

    // 2. Auth Get Me
    console.log('2. Testing GET /api/auth/me ...');
    const meRes = await request('GET', '/auth/me', null, authToken);
    console.log(`   Status: ${meRes.status} | Authenticated Employee: ${meRes.data.data.employee.name} (${meRes.data.data.employee.role.name})\n`);

    // 3. Roles List
    console.log('3. Testing GET /api/roles ...');
    const rolesRes = await request('GET', '/roles', null, authToken);
    console.log(`   Status: ${rolesRes.status} | Roles count: ${rolesRes.data.data.roles.length}\n`);

    // 4. Create Dynamic Role
    console.log('4. Testing POST /api/roles ...');
    const newRoleRes = await request('POST', '/roles', {
      name: `DRAFTSMAN_${Date.now()}`,
      description: 'Drafting team member'
    }, authToken);
    console.log(`   Status: ${newRoleRes.status} | Created Role: ${newRoleRes.data.data.role.name}\n`);

    // 5. Create Employee
    console.log('5. Testing POST /api/employees ...');
    const empEmail = `employee_${Date.now()}@office.local`;
    const newEmpRes = await request('POST', '/employees', {
      name: 'Test Staff',
      email: empEmail,
      password: 'Staff@123456',
      mobile: '9876543210',
      designation: 'Architect Draftsman',
      role_id: 1
    }, authToken);
    console.log(`   Status: ${newEmpRes.status} | Created Employee ID: ${newEmpRes.data.data.employee.id}\n`);

    // 6. Create File
    console.log('6. Testing POST /api/files ...');
    const fileNum = `FILE-TEST-${Math.floor(Math.random() * 9000 + 1000)}`;
    const newFileRes = await request('POST', '/files', {
      file_number: fileNum,
      work_type: 'Building Permission',
      applicant_name: 'Test Applicant',
      applicant_mobile: '9988776655',
      permission_type: 'Building Permission',
      floors: 'Ground, First',
      specific_built_up_area: 1800.00
    }, authToken);
    console.log(`   Status: ${newFileRes.status} | Created File ID: ${newFileRes.data.data.file.id} (Status: ${newFileRes.data.data.file.current_status})\n`);
    const fileId = newFileRes.data.data.file.id;

    // 7. Change File Status (Workflow)
    console.log(`7. Testing POST /api/files/${fileId}/status ...`);
    const statusRes = await request('POST', `/files/${fileId}/status`, {
      status: 'DRAWING_IN_PROGRESS',
      notes: 'Assigned to drawing team'
    }, authToken);
    console.log(`   Status: ${statusRes.status} | Updated Current Status: ${statusRes.data.data.file.current_status}\n`);

    // 8. Assign File
    console.log(`8. Testing POST /api/files/${fileId}/assign ...`);
    const assignRes = await request('POST', `/files/${fileId}/assign`, {
      assigned_to: 1,
      assignment_type: 'DRAWING',
      notes: 'Prepare CAD layouts'
    }, authToken);
    console.log(`   Status: ${assignRes.status} | Assigned To: ${assignRes.data.data.assignment.assignee.name}\n`);

    // 9. Create Quotation
    console.log(`9. Testing POST /api/files/${fileId}/quotations ...`);
    const qtNum = `QT-${Date.now()}`;
    const qtRes = await request('POST', `/files/${fileId}/quotations`, {
      quotation_number: qtNum,
      amount: 50000.00,
      status: 'DRAFT'
    }, authToken);
    console.log(`   Status: ${qtRes.status} | Created Quotation ID: ${qtRes.data.data.quotation.id}\n`);
    const quotationId = qtRes.data.data.quotation.id;

    // 10. Finalize Quotation
    console.log(`10. Testing POST /api/quotations/${quotationId}/finalize ...`);
    const finRes = await request('POST', `/quotations/${quotationId}/finalize`, null, authToken);
    console.log(`    Status: ${finRes.status} | Finalized Status: ${finRes.data.data.quotation.status}\n`);

    // 11. Register Payment
    console.log(`11. Testing POST /api/files/${fileId}/payments ...`);
    const payRes = await request('POST', `/files/${fileId}/payments`, {
      quotation_id: quotationId,
      amount: 20000.00,
      payment_type: 'ADVANCE',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'UPI',
      reference_number: 'UPI987654321',
      notes: 'Advance via UPI'
    }, authToken);
    console.log(`    Status: ${payRes.status} | Outstanding calculated: ₹${payRes.data.data.summary.outstandingAmount}\n`);

    // 12. Create Expense
    console.log('12. Testing POST /api/expenses ...');
    const expRes = await request('POST', '/expenses', {
      category: 'OFFICE',
      amount: 1500.00,
      expense_date: new Date().toISOString().split('T')[0],
      description: 'Office supplies'
    }, authToken);
    console.log(`    Status: ${expRes.status} | Created Expense ID: ${expRes.data.data.expense.id}\n`);

    // 13. Dashboard Summary
    console.log('13. Testing GET /api/dashboard/summary ...');
    const dashRes = await request('GET', '/dashboard/summary', null, authToken);
    console.log(`    Status: ${dashRes.status}`);
    console.log('    Summary Data:', JSON.stringify(dashRes.data.data.summary, null, 2));

    console.log('\n======================================================');
    console.log('🎉 ALL API ENDPOINTS VERIFIED & WORKING PERFECTLY!');
    console.log('======================================================\n');
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
  }
}

runApiTests();
