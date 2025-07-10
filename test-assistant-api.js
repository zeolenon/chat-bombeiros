#!/usr/bin/env node

const fetch = require('node-fetch');

async function testAssistantAPI() {
  console.log('=== TESTE DA API DO ASSISTANT-UI ===\n');

  const testCases = [
    {
      name: 'Formato Assistant-UI',
      data: {
        messages: [
          { role: 'user', content: 'Olá, como você pode me ajudar?' }
        ]
      }
    },
    {
      name: 'Formato Legado',
      data: {
        question: 'Olá, como você pode me ajudar?',
        chatId: null
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`🧪 Testando: ${testCase.name}`);
    
    try {
      const response = await fetch('http://localhost:3002/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.data),
      });

      const result = await response.json();
      
      console.log(`Status: ${response.status}`);
      console.log(`Resposta:`, JSON.stringify(result, null, 2));
      
      if (response.ok) {
        console.log('✅ Sucesso!\n');
      } else {
        console.log('❌ Falhou!\n');
      }
    } catch (error) {
      console.log(`❌ Erro: ${error.message}\n`);
    }
  }

  console.log('=== FIM DO TESTE ===');
}

testAssistantAPI().catch(console.error); 