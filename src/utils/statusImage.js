import vector1 from "../img/vector1.svg"; // 1단계: 여유
import vector2 from "../img/vector2.svg"; // 2단계: 긴장
import vector3 from "../img/vector3.svg"; // 3단계: 위기
import vector4 from "../img/vector4.svg"; // 4단계: 파멸

export const STATUS_IMAGES = {
  여유: vector1,
  긴장: vector2,
  위기: vector3,
  파멸: vector4,
};

export const getStatusImage = (status) => {
  return STATUS_IMAGES[status] || vector1;
};
