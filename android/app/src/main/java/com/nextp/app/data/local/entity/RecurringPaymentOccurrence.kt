package com.nextp.app.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Ocorrência mensal de uma conta recorrente.
 * REGRA CENTRAL: cada (recurringPaymentId, month, year) é único e independente.
 * Marcar Julho como pago NÃO afeta Agosto.
 */
@Entity(
    tableName = "recurring_payment_occurrences",
    indices = [
        Index(value = ["recurringPaymentId", "year", "month"], unique = true),
        Index(value = ["year", "month"])
    ]
)
data class RecurringPaymentOccurrence(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val recurringPaymentId: Long,
    val month: Int,                 // 1..12
    val year: Int,
    val dueDate: String,            // ISO yyyy-MM-dd
    val expectedAmount: Double,
    val paidAmount: Double = 0.0,
    val status: PaymentStatus = PaymentStatus.PENDING,
    val paidAt: String? = null,     // ISO yyyy-MM-dd
    val note: String? = null,
    val createdExpenseId: Long? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
)
