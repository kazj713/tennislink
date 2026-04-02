/**
 * 教练推荐算法
 * 基于学员需求推荐最合适的教练
 */

import { Coach } from '@/storage/database/shared/schema';

interface StudentPreference {
  budget: {
    min: number;
    max: number;
  };
  preferredTime: 'weekend' | 'weekday' | 'evening';
  city: string;
  district: string;
  learningGoal: string;
  venuePreference: 'outdoor' | 'indoor' | 'mixed';
}

interface CoachRecommendationResult {
  coach: Coach;
  score: number;
  matchDetails: {
    budgetMatch: number;
    timeMatch: number;
    goalMatch: number;
    venueMatch: number;
    ratingScore: number;
  };
}

/**
 * 计算教练与学员需求的匹配分数
 * @param coach 教练信息
 * @param preference 学员需求
 * @returns 匹配结果，包含匹配分数和详细匹配信息
 */
export function calculateCoachMatchScore(
  coach: any, // 使用any类型避免依赖问题，实际应使用Coach类型
  preference: StudentPreference
): CoachRecommendationResult {
  let totalScore = 0;
  
  // 1. 预算匹配度（20%权重）
  const hourlyRate = parseFloat(coach.hourlyRate || '0');
  const budgetMatch = hourlyRate >= preference.budget.min && hourlyRate <= preference.budget.max 
    ? 100 
    : Math.max(0, 100 - Math.abs((hourlyRate - (preference.budget.min + preference.budget.max) / 2) / (preference.budget.max - preference.budget.min) * 100));
  totalScore += budgetMatch * 0.2;
  
  // 2. 时间匹配度（20%权重）
  const availableDays = coach.availableDays || [];
  let timeMatch = 0;
  
  if (preference.preferredTime === 'weekend') {
    // 周末：周六(6)、周日(7)
    if (availableDays.includes(6) || availableDays.includes(7)) {
      timeMatch = 100;
    } else if (availableDays.length > 0) {
      timeMatch = 50;
    }
  } else if (preference.preferredTime === 'weekday') {
    // 工作日：周一(1)到周五(5)
    const hasWeekday = availableDays.some((day: number) => day >= 1 && day <= 5);
    timeMatch = hasWeekday ? 100 : (availableDays.length > 0 ? 50 : 0);
  } else {
    // 晚上：所有时间段都匹配
    timeMatch = 100;
  }
  totalScore += timeMatch * 0.2;
  
  // 3. 学习目标匹配度（25%权重）
  const specialties = coach.specialties || [];
  let goalMatch = 0;
  
  // 匹配学习目标与教练专长
  switch (preference.learningGoal) {
    case 'fat_loss':
      goalMatch = specialties.includes('减脂') ? 100 : 50;
      break;
    case 'entertainment':
      goalMatch = specialties.includes('娱乐') ? 100 : 70;
      break;
    case 'skill_improvement':
      goalMatch = specialties.includes('技术提升') ? 100 : 
                specialties.includes('发球技术') || 
                specialties.includes('底线技术') || 
                specialties.includes('网前技术') ? 80 : 50;
      break;
    case 'competition':
      goalMatch = specialties.includes('比赛战术') || 
                specialties.includes('比赛准备') ? 100 : 
                specialties.includes('技术提升') ? 70 : 50;
      break;
    default:
      goalMatch = 50;
  }
  totalScore += goalMatch * 0.25;
  
  // 4. 场地偏好匹配度（15%权重）
  // 假设教练的场地偏好信息在specialties或teachingAreas中
  const venueMatch = preference.venuePreference === 'mixed' ? 100 : 
                    specialties.includes(preference.venuePreference) ? 100 : 
                    specialties.includes('室内') || specialties.includes('室外') ? 70 : 50;
  totalScore += venueMatch * 0.15;
  
  // 5. 教练评分（20%权重）
  const ratingScore = parseFloat(coach.averageRating || '0');
  totalScore += ratingScore * 10; // 转换为0-100分
  
  return {
    coach,
    score: Math.round(totalScore),
    matchDetails: {
      budgetMatch,
      timeMatch,
      goalMatch,
      venueMatch,
      ratingScore: ratingScore * 10
    }
  };
}

/**
 * 根据学员需求推荐教练
 * @param coaches 教练列表
 * @param preference 学员需求
 * @returns 排序后的推荐结果
 */
export function recommendCoaches(
  coaches: any[], // 实际应使用Coach[]类型
  preference: StudentPreference
): CoachRecommendationResult[] {
  // 计算每个教练的匹配分数
  const scoredCoaches = coaches.map(coach => calculateCoachMatchScore(coach, preference));
  
  // 按匹配分数降序排序
  scoredCoaches.sort((a, b) => b.score - a.score);
  
  return scoredCoaches;
}

/**
 * 过滤教练列表，只返回符合基本条件的教练
 * @param coaches 教练列表
 * @param preference 学员需求
 * @returns 过滤后的教练列表
 */
export function filterCoachesByBasicConditions(
  coaches: any[],
  preference: StudentPreference
): any[] {
  return coaches.filter(coach => {
    // 只考虑已审核通过的教练
    if (coach.status !== 'approved') return false;
    
    // 价格在预算范围内
    const hourlyRate = parseFloat(coach.hourlyRate || '0');
    if (hourlyRate < preference.budget.min - 50 || hourlyRate > preference.budget.max + 50) return false;
    
    // 有可用时间
    if (!coach.availableDays || coach.availableDays.length === 0) return false;
    
    // 教学区域匹配
    const teachingAreas = coach.teachingAreas || [];
    if (preference.district && teachingAreas.length > 0 && !teachingAreas.includes(preference.district)) {
      return false;
    }
    
    return true;
  });
}
