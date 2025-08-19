// 学院和专业数据定义

export interface Major {
  id: string;
  name: string;
  order: number;
}

export interface College {
  id: number;
  name: string;
  icon: string;
  order: number;
  majors: Major[];
}

// 学院和专业数据
export const collegeData: College[] = [
  {
    id: 1,
    name: '数学科学学院',
    icon: '📊',
    order: 1,
    majors: [
      { id: 'all', name: '全部专业', order: 0 },
      { id: 'information_computing_science', name: '信息与计算科学', order: 1 },
      { id: 'applied_statistics', name: '应用统计学', order: 2 },
      { id: 'mathematics_applied_mathematics', name: '数学与应用数学', order: 3 }
    ]
  },
  {
    id: 2,
    name: '经济金融学院',
    icon: '💰',
    order: 2,
    majors: [
      { id: 'all', name: '全部专业', order: 0 },
      { id: 'finance', name: '金融学', order: 1 },
      { id: 'financial_engineering', name: '金融工程', order: 2 },
      { id: 'digital_economy', name: '数字经济', order: 3 }
    ]
  },
  {
    id: 3,
    name: '计算机科学与工程学院',
    icon: '💻',
    order: 3,
    majors: [
      { id: 'all', name: '全部专业', order: 0 },
      { id: 'iot_engineering', name: '物联网工程', order: 1 },
      { id: 'big_data_management', name: '大数据管理与应用', order: 2 },
      { id: 'computer_science_technology', name: '计算机科学与技术', order: 3 },
      { id: 'cyberspace_security', name: '网络空间安全', order: 4 }
    ]
  },
  {
    id: 4,
    name: '车辆工程学院',
    icon: '🚗',
    order: 4,
    majors: [
      { id: 'all', name: '全部专业', order: 0 },
      { id: 'armored_vehicle_engineering', name: '装甲车辆工程', order: 1 },
      { id: 'vehicle_engineering', name: '车辆工程', order: 2 },
      { id: 'energy_power_engineering', name: '能源与动力工程', order: 3 },
      { id: 'industrial_design', name: '工业设计', order: 4 },
      { id: 'intelligent_vehicle_engineering', name: '智能车辆工程', order: 5 }
    ]
  },
  {
    id: 5,
    name: '会计学院',
    icon: '📋',
    order: 5,
    majors: [
      { id: 'all', name: '全部专业', order: 0 },
      { id: 'accounting', name: '会计学', order: 1 },
      { id: 'auditing', name: '审计学', order: 2 },
      { id: 'financial_management', name: '财务管理', order: 3 }
    ]
  },
  {
    id: 6,
    name: '电气与电子工程学院',
    icon: '⚡',
    order: 6,
    majors: [
      { id: 'all', name: '全部专业', order: 0 },
      { id: 'automation', name: '自动化', order: 1 },
      { id: 'electronic_information_engineering', name: '电子信息工程', order: 2 },
      { id: 'electrical_engineering_automation', name: '电气工程及其自动化', order: 3 },
      { id: 'communication_engineering', name: '通信工程', order: 4 },
      { id: 'optoelectronic_information_science', name: '光电信息科学与工程', order: 5 }
    ]
  },
  {
    id: 7,
    name: '管理学院',
    icon: '💼',
    order: 7,
    majors: [
      { id: 'all', name: '全部专业', order: 0 },
      { id: 'marketing', name: '市场营销', order: 1 },
      { id: 'tourism_management', name: '旅游管理', order: 2 },
      { id: 'business_administration', name: '工商管理', order: 3 },
      { id: 'logistics_management', name: '物流管理', order: 4 },
      { id: 'human_resource_management', name: '人力资源管理', order: 5 },
      { id: 'labor_social_security', name: '劳动与社会保障', order: 6 }
    ]
  },
  {
    id: 8,
    name: '材料科学与工程学院',
    icon: '🧪',
    order: 8,
    majors: [
      { id: 'all', name: '全部专业', order: 0 },
      { id: 'material_forming_control', name: '材料成型及控制工程', order: 1 },
      { id: 'material_science_engineering', name: '材料科学与工程', order: 2 },
      { id: 'polymer_materials_engineering', name: '高分子材料与工程', order: 3 },
      { id: 'welding_technology_engineering', name: '焊接技术与工程', order: 4 }
    ]
  },
  {
    id: 9,
    name: '药学与生物工程学院',
    icon: '💊',
    order: 9,
    majors: [
      { id: 'all', name: '全部专业', order: 0 },
      { id: 'pharmaceutical_engineering', name: '制药工程', order: 1 },
      { id: 'biomedical_engineering', name: '生物医学工程', order: 2 },
      { id: 'pharmacy', name: '药学', order: 3 },
      { id: 'biopharmaceutical', name: '生物制药', order: 4 }
    ]
  },
  {
    id: 10,
    name: '语言与传播学院',
    icon: '🗣️',
    order: 10,
    majors: [
      { id: 'all', name: '全部专业', order: 0 },
      { id: 'english', name: '英语', order: 1 },
      { id: 'business_english', name: '商务英语', order: 2 },
      { id: 'advertising', name: '广告学', order: 3 }
    ]
  },
  {
    id: 11,
    name: '机械工程学院',
    icon: '⚙️',
    order: 11,
    majors: [
      { id: 'all', name: '全部专业', order: 0 },
      { id: 'mechanical_design_manufacturing', name: '机械设计制造及其自动化', order: 1 },
      { id: 'mechanical_electronic_engineering', name: '机械电子工程', order: 2 },
      { id: 'measurement_control_technology', name: '测控技术与仪器', order: 3 },
      { id: 'intelligent_manufacturing', name: '智能制造工程', order: 4 }
    ]
  },
  {
    id: 12,
    name: '化学化工学院',
    icon: '⚗️',
    order: 12,
    majors: [
      { id: 'all', name: '全部专业', order: 0 },
      { id: 'chemical_engineering_technology', name: '化学工程与工艺', order: 1 },
      { id: 'process_equipment_control', name: '过程装备与控制工程', order: 2 },
      { id: 'applied_chemistry', name: '应用化学', order: 3 }
    ]
  },
  {
    id: 13,
    name: '重庆知识产权学院',
    icon: '🏛️',
    order: 13,
    majors: [
      { id: 'all', name: '全部专业', order: 0 },
      { id: 'intellectual_property', name: '知识产权', order: 1 },
      { id: 'ecommerce_law', name: '电子商务及法律', order: 2 }
    ]
  },
  {
    id: 14,
    name: '两江国际学院',
    icon: '🌏',
    order: 14,
    majors: [
      { id: 'all', name: '全部专业', order: 0 },
      { id: 'chinese_international_education', name: '汉语国际教育', order: 1 }
    ]
  },
  {
    id: 15,
    name: '应用技术学院',
    icon: '🔧',
    order: 15,
    majors: [
      { id: 'all', name: '全部专业', order: 0 },
      { id: 'applied_chemistry_tech', name: '应用化学', order: 1 },
      { id: 'finance_tech', name: '金融学', order: 2 },
      { id: 'big_data_management_tech', name: '大数据管理与应用', order: 3 },
      { id: 'accounting_tech', name: '会计学', order: 4 },
      { id: 'logistics_management_tech', name: '物流管理', order: 5 }
    ]
  },
  {
    id: 16,
    name: '两江人工智能学院',
    icon: '🤖',
    order: 16,
    majors: [
      { id: 'all', name: '全部专业', order: 0 },
      { id: 'data_science_big_data', name: '数据科学与大数据技术', order: 1 },
      { id: 'software_engineering', name: '软件工程', order: 2 },
      { id: 'intelligent_science_technology', name: '智能科学与技术', order: 3 },
      { id: 'artificial_intelligence', name: '人工智能', order: 4 }
    ]
  },
  {
    id: 17,
    name: '物理与新能源学院',
    icon: '🔋',
    order: 17,
    majors: [
      { id: 'all', name: '全部专业', order: 0 },
      { id: 'new_energy_science_engineering', name: '新能源科学与工程', order: 1 },
      { id: 'optoelectronic_materials_devices', name: '光电信息材料与器件', order: 2 },
      { id: 'energy_storage_science_engineering', name: '储能科学与工程', order: 3 }
    ]
  }
];

// 辅助函数
export function getCollegeById(collegeId: number): College | undefined {
  return collegeData.find(college => college.id === collegeId);
}

export function getMajorsByCollegeId(collegeId: number): Major[] {
  const college = getCollegeById(collegeId);
  return college ? college.majors : [];
}

export function getMajorName(collegeId: number, majorId: string): string {
  const college = getCollegeById(collegeId);
  if (!college) return '';
  
  const major = college.majors.find(m => m.id === majorId);
  return major ? major.name : '';
}

export function getCollegeName(collegeId: number): string {
  const college = getCollegeById(collegeId);
  return college ? college.name : '';
}

