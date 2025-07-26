# Grafana Cloud Service Account Setup

## 🎯 Step-by-Step Service Account Creation

### 1. Access Service Accounts
1. Log into your Grafana Cloud instance: `https://ienergyy.grafana.net`
2. Click on the **Configuration** icon (gear/cog) in the left sidebar
3. Select **Service Accounts** from the menu

### 2. Create Service Account
1. Click **Add service account**
2. Fill in the details:
   - **Name**: `playwright-metrics`
   - **Display name**: `Playwright Test Metrics`
   - **Description**: `Service account for Playwright test metrics collection`
3. Click **Create**

### 3. Add Token to Service Account
1. Click on your newly created service account (`playwright-metrics`)
2. Go to the **Tokens** tab
3. Click **Add token**
4. Fill in:
   - **Name**: `playwright-metrics-token`
   - **Role**: Select **MetricsPublisher** from the dropdown
5. Click **Create**
6. **⚠️ IMPORTANT**: Copy the token immediately! You won't be able to see it again.

### 4. Update Your Configuration
Replace the placeholder in `config.env`:
```env
GRAFANA_CLOUD_SERVICE_ACCOUNT_TOKEN=glsa_your-actual-token-here
```

### 5. Test the Connection
```bash
npm run test-grafana
```

## 🔐 Service Account Benefits

- **More secure** than API keys
- **Better permission management**
- **Audit trail** for token usage
- **Easy token rotation**
- **Role-based access control**

## 🚨 Important Notes

- **Token visibility**: You can only see the token once when it's created
- **Token format**: Service account tokens start with `glsa_`
- **Permissions**: Make sure to select **MetricsPublisher** role
- **Security**: Keep your token secure and don't commit it to version control

## 🔧 Troubleshooting

### "Invalid token" error
- Check that you copied the entire token (including `glsa_` prefix)
- Verify the token hasn't expired
- Ensure the service account is active

### "Insufficient permissions" error
- Make sure the token has **MetricsPublisher** role
- Check that the service account is not disabled
- Verify the token belongs to the correct service account

### "Service account not found" error
- Ensure the service account name matches exactly
- Check that the service account is in the correct organization
- Verify you're logged into the right Grafana Cloud instance 