package com.nextp.app.data.local

import androidx.room.TypeConverter
import com.nextp.app.data.local.entity.AutoExpenseMode
import com.nextp.app.data.local.entity.ExpenseSource
import com.nextp.app.data.local.entity.PaymentStatus
import com.nextp.app.data.local.entity.PlanningType
import com.nextp.app.data.local.entity.Priority
import com.nextp.app.data.local.entity.RepeatType

/** Conversores de enums <-> String (estável para backup/restauro). */
class Converters {
    @TypeConverter fun expenseSource(v: ExpenseSource) = v.name
    @TypeConverter fun toExpenseSource(v: String) = ExpenseSource.valueOf(v)

    @TypeConverter fun planningType(v: PlanningType) = v.name
    @TypeConverter fun toPlanningType(v: String) = PlanningType.valueOf(v)

    @TypeConverter fun paymentStatus(v: PaymentStatus) = v.name
    @TypeConverter fun toPaymentStatus(v: String) = PaymentStatus.valueOf(v)

    @TypeConverter fun priority(v: Priority) = v.name
    @TypeConverter fun toPriority(v: String) = Priority.valueOf(v)

    @TypeConverter fun repeatType(v: RepeatType) = v.name
    @TypeConverter fun toRepeatType(v: String) = RepeatType.valueOf(v)

    @TypeConverter fun autoExpenseMode(v: AutoExpenseMode) = v.name
    @TypeConverter fun toAutoExpenseMode(v: String) = AutoExpenseMode.valueOf(v)
}
