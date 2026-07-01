package com.nextp.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "planning_items")
data class PlanningItem(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val type: PlanningType,
    val totalAmount: Double,
    val paidAmount: Double = 0.0,
    val remainingAmount: Double = 0.0,
    val dueDate: String? = null,    // ISO yyyy-MM-dd
    val priority: Priority = Priority.MEDIUM,
    val status: PaymentStatus = PaymentStatus.PENDING,
    val repeatType: RepeatType = RepeatType.NONE,
    val note: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
)
