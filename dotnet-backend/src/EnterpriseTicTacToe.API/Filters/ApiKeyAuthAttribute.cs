using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace EnterpriseTicTacToe.API.Filters
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class ApiKeyAuthAttribute : Attribute, IAsyncActionFilter
    {
        private const string ApiKeyHeaderName = "X-API-KEY";
        private const string DefaultServerKey = "TicTacToeEnterpriseSecretKey2026"; // Standard enterprise master fallback key

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var httpContext = context.HttpContext;
            
            if (!httpContext.Request.Headers.TryGetValue(ApiKeyHeaderName, out var extractedApiKey))
            {
                context.Result = new ContentResult
                {
                    StatusCode = 401,
                    ContentType = "application/json",
                    Content = "{\"message\": \"API Key is missing. Access Unauthorized. Please provide the 'X-API-KEY' header.\"}"
                };
                return;
            }

            var configuration = httpContext.RequestServices.GetRequiredService<IConfiguration>();
            // Check appsettings.Json variable "AuthSecret:ApiKey" or use secure default corporate token
            var configuredApiKey = configuration.GetValue<string>("AuthSecret:ApiKey") ?? DefaultServerKey;

            if (!string.Equals(configuredApiKey, extractedApiKey, StringComparison.Ordinal))
            {
                context.Result = new ContentResult
                {
                    StatusCode = 401,
                    ContentType = "application/json",
                    Content = "{\"message\": \"Invalid API Key payload. Access Unauthorized.\"}"
                };
                return;
            }

            await next();
        }
    }
}
