// models/department.js

export const departmentSchema = {
  id:         '',   // Firestore doc ID (e.g. 'sanitation')
  name:       '',
  categories: [],   // array of category values this dept handles
  adminUid:   '',   // UID of the assigned dept admin
  createdAt:  null,
}

export const DEPARTMENT_LIST = [
  { id: 'road',       name: 'Road Department',       categories: ['Broken Road', 'Open Manhole'],   adminUid: '' },
  { id: 'sanitation', name: 'Sanitation Department', categories: ['Garbage', 'Sewage'],             adminUid: '' },
  { id: 'water',      name: 'Water Department',      categories: ['Water Leakage'],                 adminUid: '' },
  { id: 'electric',   name: 'Electric Department',   categories: ['Streetlight Issue'],             adminUid: '' },
  { id: 'municipal',  name: 'Municipal Authority',   categories: ['Other'],                         adminUid: '' },
]
