@Library('my-shared-library') _

void setBuildStatus(String message, String context, String state) {
    step([
        $class: "GitHubCommitStatusSetter",
        reposSource: [$class: "ManuallyEnteredRepositorySource", url: env.GIT_URL],
        contextSource: [$class: "ManuallyEnteredCommitContextSource", context: context],
        errorHandlers: [[$class: "ChangingBuildStatusErrorHandler", result: "UNSTABLE"]],
        statusResultSource: [
            $class: "ConditionalStatusResultSource",
            results: [[$class: "AnyBuildResult", message: message, state: state]]
        ]
    ]);
}

pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
metadata:
  namespace: jenkins
  labels:
    jenkins/agent-type: kaniko
spec:
  nodeSelector:
    nodetype: agent
  containers:
  - name: jnlp
    image: chauid/jenkins-inbound-agent:jdk17-node22-k8s
  - name: kaniko
    image: gcr.io/kaniko-project/executor:debug
    command:
      - /busybox/cat
    tty: true
    volumeMounts:
      - name: docker-secret
        mountPath: /kaniko/.docker
  volumes:
    - name: docker-secret
      secret:
        secretName: docker-config-postsmith-hub
            '''
        }
    }

    options {
        timeout(5)
    }

    stages {
        stage('Initialize environment') {
            steps {
                script {
                    env.STAGE_SEQUENCE = 0
                    env.IMAGE_NAME = 'postsmith-hub.kr.ncr.ntruss.com/postsmith-blog'
                    env.IMAGE_TAG = build.getProjectVersion('nodejs')
                    withCredentials([file(credentialsId: 'postsmith_env', variable: 'APPLICATION_ENV')]) {
                        sh 'cp -f ${APPLICATION_ENV} ./.env'
                    }
                    sh 'npm install'
                }
            }
        }
        stage('CodeStyle Check') {
            steps {
                script {
                    setBuildStatus("Running Code Style Check", "CI / StyleCheck ", "PENDING")
                    env.STAGE_SEQUENCE = 1
                    sh 'npm run check'
                    setBuildStatus("Code Style Check completed successfully", "CI / StyleCheck", "SUCCESS")
                }
            }
        }
        stage('Eslint Check') {
            steps {
                script {
                    setBuildStatus("Running ESLint Check", "CI / ESLint", "PENDING")
                    env.STAGE_SEQUENCE = 2
                    sh 'npm run lint'
                    setBuildStatus("ESLint Check completed successfully", "CI / ESLint", "SUCCESS")
                }
            }
        }
        stage('Build npm') {
            steps {
                script {
                    setBuildStatus("Building Next.JS application", "CI / npm build", "PENDING")
                    env.STAGE_SEQUENCE = 3
                    build.npm()
                    setBuildStatus("Next.JS application built successfully", "CI / npm build", "SUCCESS")
                }
            }
        }
        stage('Build Container Image') {
            when {
                branch 'main';
            }
            steps {
                script {
                    setBuildStatus("Building Container image", "CI / Image Build", "PENDING")
                    env.STAGE_SEQUENCE = 4
                    build.image(env.IMAGE_NAME, env.IMAGE_TAG, true)
                    setBuildStatus("Container image built successfully", "CI / Image Build", "SUCCESS")
                }
            }
        }
        stage('Deploy K8s') {
            when {
                branch 'main';
            }
            steps {
                script {
                    setBuildStatus("Deploy to Kubernetes cluster", "CD / Kubernetes rollout", "PENDING")
                    env.STAGE_SEQUENCE = 5
                    k8s.deploy("postsmith-blog-app-deploy", "postsmith-blog-app", "postsmith-deploy", env.IMAGE_NAME, env.IMAGE_TAG)
                    setBuildStatus("Kubernetes cluster Deployed successfully", "CD / Kubernetes rollout", "SUCCESS")
                }
            }
        }

    }
    post {
        unsuccessful {
            script {
                switch (env.STAGE_SEQUENCE) {
                    case '0':
                        setBuildStatus("Failed to initialize the build process.", "Jenkins", "FAILURE")
                        break
                    case '1':
                        setBuildStatus("Failed to run Code Style Check.", "CI / StyleCheck", "FAILURE")
                        break
                    case '2':
                        setBuildStatus("Failed to run ESLint Check.", "CI / ESLint", "FAILURE")
                        break
                    case '3':
                        setBuildStatus("Failed to build the Next.JS application.", "CI / npm build", "FAILURE")
                        break
                    case '4':
                        setBuildStatus("Failed to build the Container image.", "CI / Image Build", "FAILURE")
                        break
                    case '5':
                        setBuildStatus("Failed to deploy to Kubernetes cluster.", "CD / Kubernetes rollout", "FAILURE")
                        break
                }
            }
        }
    }
}