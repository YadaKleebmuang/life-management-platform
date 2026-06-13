import { SavingsGoal } from "../../types";
import { formatCurrency } from "../../utils/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Trash2, Edit2, Target } from "lucide-react";

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onAllocate: (goal: SavingsGoal, type: "add" | "withdraw") => void;
  onEdit: (goal: SavingsGoal) => void;
  onDelete: (goalId: string) => void;
}

export function SavingsGoalCard({ goal, onAllocate, onEdit, onDelete }: SavingsGoalCardProps) {
  const percent = goal.targetAmount > 0 
    ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
    : 0;

  return (
    <Card className={`overflow-hidden transition-all ${goal.status === 'completed' ? 'opacity-70 bg-gray-50' : 'hover:border-gray-400'}`}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${goal.color || 'bg-blue-100 text-blue-700'}`}>
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                {goal.name}
                {goal.status === "completed" && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">สำเร็จแล้ว</span>}
              </h3>
              {goal.targetDate && (
                <p className="text-xs text-gray-500 mt-0.5">
                  เป้าหมายภายใน: {new Date(goal.targetDate).toLocaleDateString('th-TH')}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(goal.currentAmount)}
            </p>
            <p className="text-[10px] text-gray-500 font-medium">จาก {formatCurrency(goal.targetAmount)}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-gray-700">{percent}%</span>
            <span className="text-gray-500">เหลืออีก {formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount))}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${percent >= 100 ? 'bg-green-500' : 'bg-blue-600'}`}
              style={{ width: `${percent}%` }}
            ></div>
          </div>
        </div>

        {goal.note && (
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs mb-4 text-gray-500 italic break-words line-clamp-2">
            หมายเหตุ: {goal.note}
          </div>
        )}

        <div className="flex justify-between items-center pt-2">
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
              onClick={() => onAllocate(goal, "add")}
              disabled={goal.status === "completed"}
            >
              <Plus className="w-4 h-4 mr-1" /> เพิ่มเงิน
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-gray-500"
              onClick={() => onAllocate(goal, "withdraw")}
              disabled={goal.currentAmount <= 0}
            >
              <Minus className="w-4 h-4 mr-1" /> ดึงเงินออก
            </Button>
          </div>

          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(goal)}>
              <Edit2 className="w-4 h-4 text-gray-400 hover:text-gray-900" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(goal.id)}>
              <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
