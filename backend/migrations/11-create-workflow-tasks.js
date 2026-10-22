'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('workflow_tasks', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      file_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'files', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      task_key: { type: Sequelize.STRING(80), allowNull: false },
      title: { type: Sequelize.STRING(180), allowNull: false },
      category: { type: Sequelize.STRING(50), allowNull: false },
      sequence: { type: Sequelize.INTEGER, allowNull: false },
      is_optional: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      is_triggered: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      default_designation: { type: Sequelize.STRING(100), allowNull: true },
      assigned_to: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'employees', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      assigned_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'employees', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      assigned_at: { type: Sequelize.DATE, allowNull: true },
      completed_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'employees', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      completed_at: { type: Sequelize.DATE, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });

    await queryInterface.addIndex('workflow_tasks', ['file_id']);
    await queryInterface.addIndex('workflow_tasks', ['assigned_to']);
    await queryInterface.addIndex('workflow_tasks', ['task_key', 'file_id'], { unique: true });

    const [files] = await queryInterface.sequelize.query('SELECT id, work_type FROM files');
    const buildingTasks = [
      ['collect_layout_plan', 'Collect layout plan', 'DOCUMENT', 'Office Assistant'],
      ['collect_na_order', 'Collect NA order', 'DOCUMENT', 'Office Assistant'],
      ['collect_712_property_card', 'Collect 7/12 or Property Card', 'DOCUMENT', 'Office Assistant'],
      ['collect_aeenxer_d', 'Collect Aeenxer-D', 'DOCUMENT', 'Office Assistant'],
      ['collect_aeenxer_e', 'Collect Aeenxer-E', 'DOCUMENT', 'Office Assistant'],
      ['collect_form_2a', 'Collect FORM-2A', 'DOCUMENT', 'Office Assistant'],
      ['collect_bahedhari', 'Collect Bahedhari', 'DOCUMENT', 'Office Assistant'],
      ['collect_joining_certificate', 'Collect Joining Certificate', 'DOCUMENT', 'Office Assistant'],
      ['create_autocad_file', 'Create AutoCAD file', 'TECHNICAL', 'Civil Engineer'],
      ['fill_enagar_form', 'Fill form at eNagar', 'ONLINE', 'Office Assistant'],
      ['pay_scrutiny_fee', 'Pay scrutiny fee', 'FEE', 'Owner'],
      ['solve_enagar_query', 'Solve eNagar query', 'QUERY', 'Civil Engineer'],
      ['nagarpalika_approval', 'Obtain Nagarpalika approval', 'APPROVAL', 'Owner'],
      ['solve_approval_query', 'Solve approval query and upload to eNagar', 'QUERY', 'Civil Engineer'],
      ['pay_sanction_fee', 'Pay sanction fees', 'FEE', 'Owner']
    ];
    const generalTasks = [
      ['collect_general_documents', 'Collect general documents and details', 'DOCUMENT', 'Office Assistant'],
      ['complete_file', 'Complete file', 'PROCESSING', 'Owner']
    ];
    const commonTasks = [
      ['collect_client_payment', 'Collect client payment', 'PAYMENT', 'Owner'],
      ['deliver_file_to_client', 'Deliver file to client', 'DELIVERY', null]
    ];
    const tasks = files.flatMap((file) => [
      ...(file.work_type === 'Building Permission' ? buildingTasks : generalTasks),
      ...commonTasks
    ].map(([task_key, title, category, default_designation], index) => ({
      file_id: file.id, task_key, title, category, default_designation,
      sequence: index + 1,
      is_optional: category === 'QUERY',
      is_triggered: category !== 'QUERY',
      created_at: new Date(), updated_at: new Date()
    })));
    if (tasks.length) await queryInterface.bulkInsert('workflow_tasks', tasks);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('workflow_tasks');
  }
};