// 商品表单类型定义

export interface ProductForm {
  title: string;
  author: string; // 现在代表商品简要描述
  price: string;
  originalPrice: string;
  stock: string;
  collegeId: number;
  collegeIndex: number;
  collegeName: string;
  majorId: string;
  majorIndex: number;
  majorName: string;
  description: string;
  condition: string;
  conditionIndex: number;
  icon: string;
  images: string[];
}

export interface BookData {
  title: string;
  author: string; // 现在代表商品简要描述
  price: number;
  originalPrice?: number;
  stock: number;
  collegeId: number;
  collegeName: string;
  majorId: string;
  majorName: string;
  description: string;
  condition: string;
  icon: string;
  images: string[];
  status: string;
}

