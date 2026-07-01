package com.nextp.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.nextp.app.ui.components.ClayCard
import com.nextp.app.ui.theme.NextPColors

/**
 * Ecrãs base das 4 abas. São stubs visuais do design system;
 * cada fase do roadmap substitui-os pela funcionalidade real.
 */
@Composable
private fun TabScaffold(title: String, subtitle: String) {
    Column(
        modifier = Modifier.fillMaxSize().padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(title, style = androidx.compose.material3.MaterialTheme.typography.headlineMedium)
        ClayCard(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier.fillMaxSize(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                Text("🚧", style = androidx.compose.material3.MaterialTheme.typography.displaySmall)
                Spacer(Modifier.height(8.dp))
                Text(
                    subtitle,
                    color = NextPColors.TextMuted,
                    textAlign = TextAlign.Center,
                )
            }
        }
    }
}

@Composable fun RecordsScreen() = TabScaffold("Registos", "Fase 3: registo rápido de gastos diários.")
@Composable fun SavedScreen() = TabScaffold("Guardados", "Fase 4: bens e compras importantes.")
@Composable fun PlanningScreen() = TabScaffold("Planeamento", "Fases 5–6: contas, dívidas e pagamentos recorrentes.")
@Composable fun SummaryScreen() = TabScaffold("Resumo", "Fase 7: gráficos, estatísticas e Gastos Invisíveis.")
