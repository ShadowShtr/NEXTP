package com.nextp.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Definições do utilizador. Preferências simples também podem viver em DataStore;
 * mantém-se aqui o que precisa entrar no backup estruturado.
 */
@Entity(tableName = "user_settings")
data class UserSettings(
    @PrimaryKey val id: Int = 1,    // singleton
    val currency: String = "EUR",
    val dailyReminderEnabled: Boolean = true,
    val dailyReminderTime: String = "21:00",
    val monthlyBudget: Double? = null,
    val smallExpenseLimit: Double = 5.0,   // "Gastos Invisíveis"
    val backupEnabled: Boolean = false,
    val lastBackupAt: Long? = null,
    val theme: String = "system",          // system | light | dark
)
