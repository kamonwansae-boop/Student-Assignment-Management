export interface FirestoreErrorInfo {
  code: string;
  message: string;
  description: string;
  action: string;
}

export function handleFirestoreError(error: any, operationName: string): FirestoreErrorInfo {
  const code = error?.code || 'unknown';
  const rawMessage = error?.message || String(error);

  let description = 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ Firebase';
  let action = 'กรุณาลองใหม่อีกครั้ง หรือตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';

  switch (code) {
    case 'permission-denied':
      description = 'ไม่มีสิทธิ์ในการเข้าถึงหรือแก้ไขข้อมูลใน Firestore หรือ Storage';
      action = 'กรุณาตรวจสอบการตั้งค่า Firebase Security Rules';
      break;
    case 'not-found':
      description = 'ไม่พบเอกสารหรือไฟล์ที่ต้องการในระบบ';
      action = 'ไฟล์หรือเอกสารอาจถูกลบไปแล้ว';
      break;
    case 'already-exists':
      description = 'มีข้อมูลนี้อยู่ในระบบแล้ว';
      action = 'กรุณาตรวจสอบข้อมูลซ้ำ';
      break;
    case 'resource-exhausted':
      description = 'โควต้าการใช้งานเกินกำหนด';
      action = 'ระบบได้ลบไฟล์ที่ตรวจแล้วเพื่อคืนพื้นที่โควต้า 5GB ให้แล้ว';
      break;
    case 'storage/unauthorized':
      description = 'ไม่มีสิทธิ์ในการอัปโหลดหรือลบไฟล์ใน Firebase Storage';
      action = 'ตรวจสอบ Storage Security Rules';
      break;
    case 'storage/object-not-found':
      description = 'ไม่พบไฟล์ใน Storage (อาจถูกลบไปแล้วเพื่อคืนพื้นที่โควต้า)';
      action = 'ไม่ต้องดำเนินการใดเพิ่มเติม ไฟล์ถูกลบเรียบร้อยแล้ว';
      break;
    case 'storage/quota-exceeded':
      description = 'พื้นที่จัดเก็บ Firebase Storage เกินโควต้า 5GB';
      action = 'กรุณาใช้ฟังก์ชัน ตรวจงานและลบไฟล์ (gradeAndDelete) เพื่อคืนพื้นที่';
      break;
    case 'unavailable':
      description = 'บริการ Firebase ไม่พร้อมใช้งานชั่วคราว';
      action = 'กรุณารอสักครู่แล้วลองใหม่อีกครั้ง';
      break;
  }

  const result: FirestoreErrorInfo = {
    code,
    message: `${operationName} failed: ${rawMessage}`,
    description,
    action,
  };

  console.error(`[Firebase Error] [${operationName}]`, result);
  return result;
}
